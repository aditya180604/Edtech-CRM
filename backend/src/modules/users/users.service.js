import mongoose from 'mongoose';
import { User, Course, Topic, Lesson, LearningProgress, Entitlement } from '../../models/index.js';
import { AppError } from '../../utils/apiResponse.js';
import { AuditLogger } from '../../utils/auditLogger.js';

export class UsersService {
  /**
   * Retrieve current authenticated user profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  /**
   * Retrieve public Verified Skill Passport data
   */
  static async getPassport(identifier) {
    let query = null;
    if (mongoose.isValidObjectId(identifier)) {
      query = { _id: new mongoose.Types.ObjectId(identifier) };
    } else {
      const clean = (identifier || '').trim().toLowerCase();
      const parts = clean.split('-');
      if (parts.length >= 2) {
        query = {
          firstName: new RegExp(`^${parts[0]}$`, 'i'),
          lastName: new RegExp(`^${parts.slice(1).join(' ')}$`, 'i'),
        };
      } else {
        query = {
          $or: [
            { firstName: new RegExp(`^${clean}$`, 'i') },
            { email: new RegExp(`^${clean}@`, 'i') },
          ],
        };
      }
    }

    let user = await User.findOne(query).lean();
    if (!user && mongoose.isValidObjectId(identifier)) {
      user = await User.findById(identifier).lean();
    }
    if (!user) {
      user = await User.findOne({
        $or: [
          { firstName: new RegExp(identifier.replace(/-/g, ' '), 'i') },
          { lastName: new RegExp(identifier.replace(/-/g, ' '), 'i') },
        ],
      }).lean();
    }
    if (!user) {
      throw new AppError('Learner not found.', 404);
    }

    // Progress and learning metrics for THIS student
    const userObjId = user._id;

    // Entitlements: courses and topics purchased by THIS student
    const entitlements = await Entitlement.find({
      userId: userObjId,
      status: 'ACTIVE',
    }).lean();

    const courseIdSet = new Set();
    const topicIdSet = new Set();

    for (const ent of entitlements) {
      if (ent.productType === 'COURSE' || ent.courseId) {
        const cId = ent.courseId ? ent.courseId.toString() : ent.productId?.toString();
        if (cId && mongoose.isValidObjectId(cId)) courseIdSet.add(cId);
      } else if (ent.productType === 'TOPIC' || ent.topicId) {
        const tId = ent.topicId ? ent.topicId.toString() : ent.productId?.toString();
        if (tId && mongoose.isValidObjectId(tId)) topicIdSet.add(tId);
        if (ent.courseId && mongoose.isValidObjectId(ent.courseId.toString())) {
          courseIdSet.add(ent.courseId.toString());
        }
      }
    }

    const courseObjectIds = Array.from(courseIdSet).map((id) => new mongoose.Types.ObjectId(id));
    const topicObjectIds = Array.from(topicIdSet).map((id) => new mongoose.Types.ObjectId(id));

    // Fetch this student's purchased courses
    const courses = await Course.find({
      _id: { $in: courseObjectIds },
    }).select('title slug thumbnail description skills category rating').lean();

    // Fetch topics belonging to this student's courses or individual topic purchases
    const topics = await Topic.find({
      $or: [
        { courseId: { $in: courseObjectIds } },
        { _id: { $in: topicObjectIds } },
      ],
    }).select('title courseId skills duration order').lean();

    const allTopicIds = topics.map((t) => t._id);

    // Fetch lessons for these topics
    const lessons = await Lesson.find({
      topicId: { $in: allTopicIds },
    }).select('title topicId duration').lean();

    // Fetch THIS student's actual learning progress
    const progressList = await LearningProgress.find({ userId: userObjId }).lean();
    const completedLessonIds = new Set(
      progressList.filter((p) => p.completed).map((p) => p.lessonId?.toString()).filter(Boolean)
    );

    // Map lessons to each course
    const topicToCourseMap = new Map();
    topics.forEach((t) => {
      if (t.courseId) topicToCourseMap.set(t._id.toString(), t.courseId.toString());
    });

    const courseLessonsMap = new Map();
    for (const l of lessons) {
      const cId = topicToCourseMap.get(l.topicId?.toString());
      if (cId) {
        if (!courseLessonsMap.has(cId)) courseLessonsMap.set(cId, []);
        courseLessonsMap.get(cId).push(l);
      }
    }

    // Dynamic, realistic Skill Matrix calculated from THIS student's enrolled courses
    const skillsMap = new Map(); // skillName -> { name, proficiency, verified, courseTitle }

    for (const course of courses) {
      const cIdStr = course._id.toString();
      const courseLessons = courseLessonsMap.get(cIdStr) || [];
      const totalCourseLessons = courseLessons.length;
      const completedCourseLessons = courseLessons.filter((l) =>
        completedLessonIds.has(l._id.toString())
      ).length;

      // Realistic course progress for this student (0% to 100%)
      const courseProgressPercent =
        totalCourseLessons > 0
          ? Math.round((completedCourseLessons / totalCourseLessons) * 100)
          : 0;

      // Extract skills explicitly taught in this course
      const courseSkills = Array.isArray(course.skills) && course.skills.length > 0
        ? course.skills
        : (course.category ? [course.category] : []);

      courseSkills.forEach((skillName, idx) => {
        const cleanName = skillName.trim();
        if (!cleanName) return;

        // Skill position along the course curriculum (0 to 1)
        const skillCurriculumFraction = (idx + 0.5) / Math.max(1, courseSkills.length);
        const progressFraction = courseProgressPercent / 100;

        let proficiency = 0;
        if (progressFraction >= skillCurriculumFraction) {
          // Concept is covered in the completed section of the course (78% - 95%)
          const masteryBonus = (progressFraction - skillCurriculumFraction) * 15;
          proficiency = Math.min(96, Math.round(82 + masteryBonus));
        } else {
          // Concept is at active learning frontier or upcoming
          const deficit = skillCurriculumFraction - progressFraction;
          if (deficit < 0.25) {
            proficiency = Math.round(35 + (1 - deficit / 0.25) * 35);
          } else {
            proficiency = Math.max(12, Math.round(25 - deficit * 20));
          }
        }

        // If this skill already exists from another course, take the highest proficiency
        if (skillsMap.has(cleanName)) {
          const existing = skillsMap.get(cleanName);
          if (proficiency > existing.proficiency) {
            skillsMap.set(cleanName, {
              name: cleanName,
              proficiency,
              verified: proficiency >= 50,
              courseTitle: course.title,
            });
          }
        } else {
          skillsMap.set(cleanName, {
            name: cleanName,
            proficiency,
            verified: proficiency >= 50,
            courseTitle: course.title,
          });
        }
      });
    }

    // Also include any topic-specific skills for standalone purchased topics
    for (const t of topics) {
      if (Array.isArray(t.skills)) {
        for (const sk of t.skills) {
          const cleanName = sk.trim();
          if (cleanName && !skillsMap.has(cleanName)) {
            const topicLessons = lessons.filter((l) => l.topicId?.toString() === t._id.toString());
            const topicCompleted =
              topicLessons.length > 0 &&
              topicLessons.every((l) => completedLessonIds.has(l._id.toString()));
            skillsMap.set(cleanName, {
              name: cleanName,
              proficiency: topicCompleted ? 88 : 45,
              verified: topicCompleted,
              courseTitle: t.title,
            });
          }
        }
      }
    }

    const skillsMatrix = Array.from(skillsMap.values());

    // Calculate real learning hours for THIS student
    let totalSeconds = 0;
    for (const p of progressList) {
      if (p.completed) {
        totalSeconds += p.watchedSeconds && p.watchedSeconds > 300 ? p.watchedSeconds : 900;
      } else if (p.watchedSeconds) {
        totalSeconds += p.watchedSeconds;
      }
    }
    const totalHours = totalSeconds > 0 ? +(totalSeconds / 3600).toFixed(1) : 0;

    // Completed courses count for THIS student
    let completedCoursesCount = 0;
    for (const course of courses) {
      const cIdStr = course._id.toString();
      const courseLessons = courseLessonsMap.get(cIdStr) || [];
      if (
        courseLessons.length > 0 &&
        courseLessons.every((l) => completedLessonIds.has(l._id.toString()))
      ) {
        completedCoursesCount++;
      }
    }

    return {
      studentId: `STU-${user._id.toString().slice(-8).toUpperCase()}`,
      userId: user._id.toString(),
      firstName: user.firstName || 'Learner',
      lastName: user.lastName || '',
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Verified Learner',
      headline: user.headline || 'EduTech Certified Learner',
      profilePhoto: user.profilePhoto || null,
      institution: user.institution || '',
      qualification: user.qualification || '',
      graduationYear: user.graduationYear || null,
      city: user.city || '',
      state: user.state || '',
      country: user.country || 'India',
      memberSince: user.createdAt || new Date(),
      totalLearningHours: totalHours,
      completedLessonsCount: completedLessonIds.size,
      completedCoursesCount,
      enrolledCoursesCount: courses.length,
      skills: skillsMatrix,
      enrolledCourses: courses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        thumbnail: c.thumbnail,
        category: c.category,
      })),
      isVerified: Boolean(user.isProfileCompleted),
    };
  }

  /**
   * Safely update profile with strict whitelist filtering
   */
  static async updateProfile(userId, updateData) {
    // Whitelisted editable profile fields
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'profilePhoto',
      'country',
      'state',
      'city',
      'timezone',
      'preferredLanguage',
      'learningPreferences',
      'qualification',
      'institution',
      'graduationYear',
      'headline',
      'skills',
      'interests',
      'isProfileCompleted',
    ];

    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updateData) {
        safeUpdates[key] = updateData[key];
      }
    }

    // Check if client attempted to alter privileged fields
    const privilegedFields = [
      'role',
      'status',
      'email',
      'passwordHash',
      'emailVerified',
      'verificationToken',
      'passwordResetToken',
      'passwordResetExpires',
      'refreshTokenHash',
    ];

    const attemptedPrivileged = privilegedFields.filter((field) => field in updateData);
    if (attemptedPrivileged.length > 0) {
      await AuditLogger.log({
        actorId: userId,
        action: 'PRIVILEGED_FIELD_UPDATE_ATTEMPT_BLOCKED',
        resourceType: 'USER',
        resourceId: userId.toString(),
        newValue: { blockedFields: attemptedPrivileged },
      });
    }

    const user = await User.findByIdAndUpdate(userId, safeUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }
}

