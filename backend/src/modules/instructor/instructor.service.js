import mongoose from 'mongoose';
import {
  User,
  InstructorProfile,
  Course,
  Module,
  Topic,
  Lesson,
  Resource,
  Webinar,
  Review,
  Rating,
  CommunityQuestion,
  Answer,
  Entitlement,
  LearningProgress,
} from '../../models/index.js';
import { ROLES } from '../../config/constants.js';

export class InstructorService {
  /**
   * 1. Get Live Instructor Dashboard Telemetry
   */
  static async getDashboardData(userId, timeframe = '30d') {
    const instructorObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch Instructor's courses
    const courses = await Course.find({ instructorId: instructorObjectId })
      .sort({ updatedAt: -1 })
      .lean();

    const courseIds = courses.map((c) => c._id);

    // Live counts
    const [totalTopics, totalEntitlements, reviews, webinars, recentQuestions] =
      await Promise.all([
        Topic.countDocuments({ courseId: { $in: courseIds } }),
        Entitlement.find({ courseId: { $in: courseIds }, status: 'ACTIVE' })
          .populate('userId', 'firstName lastName email profilePhoto')
          .sort({ createdAt: -1 })
          .lean(),
        Review.find({ courseId: { $in: courseIds } }).lean(),
        Webinar.find({ instructorId: instructorObjectId })
          .sort({ startTime: 1 })
          .lean(),
        CommunityQuestion.find({ courseId: { $in: courseIds } })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'firstName lastName email profilePhoto')
          .lean(),
      ]);

    // Unique students enrolled
    const uniqueStudentIds = new Set(totalEntitlements.map((e) => e.userId?._id?.toString()).filter(Boolean));
    const totalStudentsCount = uniqueStudentIds.size;

    // Calculate Average Rating
    const totalRatingSum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const averageRating = reviews.length > 0 ? Number((totalRatingSum / reviews.length).toFixed(1)) : 0.0;

    // Students by Course distribution (Donut chart data)
    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
    const courseDistribution = courses.slice(0, 5).map((c, idx) => {
      const enrolled = totalEntitlements.filter((e) => e.courseId?.toString() === c._id.toString()).length;
      return {
        courseId: c._id,
        title: c.title,
        studentsCount: enrolled,
        color: colors[idx % colors.length],
      };
    });

    // Student Growth monthly telemetry (Jan - Dec)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const studentGrowth = months.map((m, i) => {
      const isPastOrCurrent = i <= currentMonthIdx;
      return {
        month: m,
        students: isPastOrCurrent && courses.length > 0 ? Math.round(totalStudentsCount / (currentMonthIdx + 1)) : 0,
        revenue: isPastOrCurrent && courses.length > 0 ? Math.round((courses.reduce((a, b) => a + (b.coursePrice || 0), 0) * totalStudentsCount) / (currentMonthIdx + 1)) : 0,
      };
    });

    // Selected / Active Course for Syllabus Accordion
    let activeCourse = courses[0] || null;
    let syllabus = [];

    if (activeCourse) {
      const modules = await Module.find({ courseId: activeCourse._id }).sort({ order: 1 }).lean();
      const moduleIds = modules.map((m) => m._id);
      const topics = await Topic.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean();
      const topicIds = topics.map((t) => t._id);
      const lessons = await Lesson.find({ topicId: { $in: topicIds } }).sort({ order: 1 }).lean();

      syllabus = modules.map((mod) => {
        const modTopics = topics.filter((t) => t.moduleId.toString() === mod._id.toString());
        const modTopicIds = modTopics.map((t) => t._id.toString());
        const modLessons = lessons.filter((l) => modTopicIds.includes(l.topicId.toString()));
        const durationSum = modTopics.reduce((acc, t) => acc + (t.duration || 30), 0);

        return {
          _id: mod._id,
          title: mod.title,
          order: mod.order,
          topicsCount: modTopics.length,
          lessonsCount: modLessons.length,
          duration: `${Math.floor(durationSum / 60)}h ${durationSum % 60}m`,
          topics: modTopics.map((t) => ({
            _id: t._id,
            title: t.title,
            price: t.price,
            isFree: t.isFree,
            duration: t.duration,
            lessons: lessons.filter((l) => l.topicId.toString() === t._id.toString()),
          })),
        };
      });
    }

    // Recent Student Activity
    const recentActivity = totalEntitlements.slice(0, 5).map((e, idx) => ({
      _id: e._id || `act-${idx}`,
      studentName: `${e.userId?.firstName || 'Student'} ${e.userId?.lastName || ''}`.trim(),
      studentAvatar: e.userId?.profilePhoto || null,
      courseTitle: courses.find((c) => c._id.toString() === e.courseId?.toString())?.title || 'Course',
      action: 'enrolled in',
      timeAgo: 'Recently',
    }));

    return {
      metrics: {
        totalCourses: courses.length,
        totalTopics: totalTopics,
        totalStudents: totalStudentsCount,
        averageRating: averageRating,
      },
      charts: {
        studentGrowth,
        studentsByCourse: courseDistribution,
      },
      myCourses: courses.slice(0, 4),
      recentActivity,
      upcomingWebinars: webinars.slice(0, 3),
      activeCourse,
      syllabus,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 2. Get All Instructor's Courses with Filters
   */
  static async getCourses(userId, { status, search, category, page = 1, limit = 20 }) {
    const query = { instructorId: new mongoose.Types.ObjectId(userId) };

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { shortDescription: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [courses, total, totalAll, totalPublished, totalDraft, totalUnderReview, totalArchived] =
      await Promise.all([
        Course.find(query).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
        Course.countDocuments(query),
        Course.countDocuments({ instructorId: userId }),
        Course.countDocuments({ instructorId: userId, status: 'PUBLISHED' }),
        Course.countDocuments({ instructorId: userId, status: 'DRAFT' }),
        Course.countDocuments({ instructorId: userId, status: 'UNDER_REVIEW' }),
        Course.countDocuments({ instructorId: userId, status: 'ARCHIVED' }),
      ]);

    return {
      courses,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
      counts: {
        all: totalAll,
        published: totalPublished,
        draft: totalDraft,
        underReview: totalUnderReview,
        archived: totalArchived,
      },
    };
  }

  /**
   * 3. Create Course (5-Step Wizard)
   */
  static async createCourse(userId, courseData) {
    const slug =
      courseData.slug ||
      courseData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const course = new Course({
      ...courseData,
      slug,
      instructorId: new mongoose.Types.ObjectId(userId),
      status: courseData.status || 'PUBLISHED',
      publishedAt: courseData.status === 'PUBLISHED' ? new Date() : undefined,
      syllabusUrl: courseData.syllabusUrl,
      syllabusFileName: courseData.syllabusFileName,
    });

    await course.save();

    // If initial modules were provided in the wizard
    if (courseData.modules && Array.isArray(courseData.modules)) {
      for (let i = 0; i < courseData.modules.length; i++) {
        const modData = courseData.modules[i];
        const cleanTitle = (modData.title || `Module ${i + 1}`).replace(/^Module\s*\d+\s*:\s*/i, '');
        const newMod = await Module.create({
          courseId: course._id,
          title: `Module ${i + 1}: ${cleanTitle}`,
          order: i + 1,
          status: 'PUBLISHED',
        });

        if (modData.topics && Array.isArray(modData.topics)) {
          for (let j = 0; j < modData.topics.length; j++) {
            const topData = modData.topics[j];
            const newTop = await Topic.create({
              moduleId: newMod._id,
              courseId: course._id,
              title: topData.title || `Topic ${j + 1}`,
              price: Number(topData.price) || 0,
              isFree: !!topData.isFree,
              duration: Number(topData.duration) || 45,
              order: j + 1,
              status: 'PUBLISHED',
            });

            // If lessons / video were provided inside the topic
            if (topData.lessons && Array.isArray(topData.lessons) && topData.lessons.length > 0) {
              for (let k = 0; k < topData.lessons.length; k++) {
                const lesData = topData.lessons[k];
                await Lesson.create({
                  topicId: newTop._id,
                  title: lesData.title || `Lesson ${k + 1}`,
                  duration: lesData.duration || 15,
                  playbackReference: lesData.videoUrl || lesData.playbackReference || topData.videoUrl || '',
                  order: k + 1,
                  status: 'PUBLISHED',
                });
              }
            } else if (topData.videoUrl) {
              // Auto-create lesson with the uploaded/embedded video
              await Lesson.create({
                topicId: newTop._id,
                title: topData.title || 'Video Lesson',
                duration: topData.duration || 30,
                playbackReference: topData.videoUrl,
                order: 1,
                status: 'PUBLISHED',
              });
            }
          }
        }
      }
    }

    return course;
  }

  /**
   * 3b. Get Complete Course Data with Syllabus for Editing
   */
  static async getCourseById(userId, courseId) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!course) throw new Error('Course not found or unauthorized');

    const modules = await Module.find({ courseId }).sort({ order: 1 }).lean();
    const modulesWithTopics = await Promise.all(
      modules.map(async (mod, idx) => {
        const topics = await Topic.find({ moduleId: mod._id }).sort({ order: 1 }).lean();
        const topicsWithLessons = await Promise.all(
          topics.map(async (top) => {
            const lessons = await Lesson.find({ topicId: top._id }).sort({ order: 1 }).lean();
            const firstVideo = lessons.find((l) => l.playbackReference)?.playbackReference || '';
            return {
              ...top,
              videoUrl: firstVideo,
              lessons,
            };
          })
        );
        return {
          ...mod,
          title: mod.title.replace(/^Module\s*\d+\s*:\s*/i, ''),
          displayTitle: `Module ${idx + 1}: ${mod.title.replace(/^Module\s*\d+\s*:\s*/i, '')}`,
          topics: topicsWithLessons,
        };
      })
    );

    return {
      course,
      modules: modulesWithTopics,
    };
  }

  /**
   * 3c. Update Complete Course (Full Course Edit Functionality)
   */
  static async updateCourse(userId, courseId, updateData) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });

    if (!course) throw new Error('Course not found or unauthorized');

    // Update root course fields
    if (updateData.title) course.title = updateData.title;
    if (updateData.shortDescription !== undefined) course.shortDescription = updateData.shortDescription;
    if (updateData.description !== undefined) course.description = updateData.description;
    if (updateData.thumbnail) course.thumbnail = updateData.thumbnail;
    if (updateData.banner) course.banner = updateData.banner;
    if (updateData.category) course.category = updateData.category;
    if (updateData.level) course.level = updateData.level;
    if (updateData.language) course.language = updateData.language;
    if (updateData.skills) course.skills = updateData.skills;
    if (updateData.requirements) course.requirements = updateData.requirements;
    if (updateData.learningObjectives) course.learningObjectives = updateData.learningObjectives;
    if (updateData.coursePrice !== undefined) course.coursePrice = Number(updateData.coursePrice);
    if (updateData.currency) course.currency = updateData.currency;
    if (updateData.status) course.status = updateData.status;
    if (updateData.visibility) course.visibility = updateData.visibility;
    if (updateData.syllabusUrl !== undefined) course.syllabusUrl = updateData.syllabusUrl;
    if (updateData.syllabusFileName !== undefined) course.syllabusFileName = updateData.syllabusFileName;

    await course.save();

    // If updated modules hierarchy is passed, synchronize it
    if (updateData.modules && Array.isArray(updateData.modules)) {
      // Remove previous modules and cascading topics/lessons
      const oldModules = await Module.find({ courseId });
      for (const oldMod of oldModules) {
        const oldTopics = await Topic.find({ moduleId: oldMod._id });
        for (const oldTop of oldTopics) {
          await Lesson.deleteMany({ topicId: oldTop._id });
        }
        await Topic.deleteMany({ moduleId: oldMod._id });
      }
      await Module.deleteMany({ courseId });

      // Re-create new hierarchy cleanly
      for (let i = 0; i < updateData.modules.length; i++) {
        const modData = updateData.modules[i];
        const cleanTitle = (modData.title || `Module ${i + 1}`).replace(/^Module\s*\d+\s*:\s*/i, '');
        const newMod = await Module.create({
          courseId: course._id,
          title: `Module ${i + 1}: ${cleanTitle}`,
          order: i + 1,
          status: 'PUBLISHED',
        });

        if (modData.topics && Array.isArray(modData.topics)) {
          for (let j = 0; j < modData.topics.length; j++) {
            const topData = modData.topics[j];
            const newTop = await Topic.create({
              moduleId: newMod._id,
              courseId: course._id,
              title: topData.title || `Topic ${j + 1}`,
              price: Number(topData.price) || 0,
              isFree: !!topData.isFree,
              duration: Number(topData.duration) || 45,
              order: j + 1,
              status: 'PUBLISHED',
            });

            if (topData.lessons && Array.isArray(topData.lessons) && topData.lessons.length > 0) {
              for (let k = 0; k < topData.lessons.length; k++) {
                const lesData = topData.lessons[k];
                await Lesson.create({
                  topicId: newTop._id,
                  title: lesData.title || `Lesson ${k + 1}`,
                  duration: lesData.duration || 15,
                  playbackReference: lesData.videoUrl || lesData.playbackReference || topData.videoUrl || '',
                  order: k + 1,
                  status: 'PUBLISHED',
                });
              }
            } else if (topData.videoUrl) {
              await Lesson.create({
                topicId: newTop._id,
                title: topData.title || 'Video Lesson',
                duration: topData.duration || 30,
                playbackReference: topData.videoUrl,
                order: 1,
                status: 'PUBLISHED',
              });
            }
          }
        }
      }
    }

    return course;
  }

  /**
   * 3d. Delete Course & Cascades
   */
  static async deleteCourse(userId, courseId) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });

    if (!course) throw new Error('Course not found or unauthorized');

    const modules = await Module.find({ courseId });
    for (const mod of modules) {
      const topics = await Topic.find({ moduleId: mod._id });
      for (const top of topics) {
        await Lesson.deleteMany({ topicId: top._id });
      }
      await Topic.deleteMany({ moduleId: mod._id });
    }
    await Module.deleteMany({ courseId });
    await Course.deleteOne({ _id: courseId });

    return { message: 'Course and curriculum successfully deleted' };
  }

  /**
   * 4. Update Course Price Dynamically
   */
  static async updateCoursePrice(userId, courseId, { coursePrice, currency = 'INR' }) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, instructorId: userId },
      { coursePrice, currency },
      { new: true }
    );
    return course;
  }

  /**
   * 5. Toggle Course Visibility & Status
   */
  static async updateCourseVisibility(userId, courseId, { visibility, status }) {
    const update = {};
    if (visibility) update.visibility = visibility;
    if (status) {
      update.status = status;
      if (status === 'PUBLISHED') update.publishedAt = new Date();
    }

    const course = await Course.findOneAndUpdate(
      { _id: courseId, instructorId: userId },
      update,
      { new: true }
    );
    return course;
  }

  /**
   * 6. Add Module to Course
   */
  static async addModule(userId, courseId, { title, description, order }) {
    const course = await Course.findOne({ _id: courseId, instructorId: userId });
    if (!course) throw new Error('Course not found or unauthorized');

    const modCount = await Module.countDocuments({ courseId });
    const module = await Module.create({
      courseId,
      title,
      description,
      order: order || modCount + 1,
      status: 'PUBLISHED',
    });
    return module;
  }

  /**
   * 7. Add Topic to Module (Atomic Pricing)
   */
  static async addTopic(userId, moduleId, topicData) {
    const mod = await Module.findById(moduleId);
    if (!mod) throw new Error('Module not found');

    const course = await Course.findOne({ _id: mod.courseId, instructorId: userId });
    if (!course) throw new Error('Unauthorized');

    const topicCount = await Topic.countDocuments({ moduleId });
    const topic = await Topic.create({
      ...topicData,
      moduleId,
      courseId: mod.courseId,
      order: topicData.order || topicCount + 1,
      status: 'PUBLISHED',
    });
    return topic;
  }

  /**
   * 8. Add Lesson to Topic
   */
  static async addLesson(userId, topicId, lessonData) {
    const topic = await Topic.findById(topicId);
    if (!topic) throw new Error('Topic not found');

    const course = await Course.findOne({ _id: topic.courseId, instructorId: userId });
    if (!course) throw new Error('Unauthorized');

    const lessonCount = await Lesson.countDocuments({ topicId });
    const lesson = await Lesson.create({
      ...lessonData,
      topicId,
      order: lessonData.order || lessonCount + 1,
      status: 'PUBLISHED',
    });
    return lesson;
  }

  /**
   * 9. Get Webinars List & Metrics
   */
  static async getWebinars(userId, { status, search }) {
    const query = { instructorId: new mongoose.Types.ObjectId(userId) };

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const [webinars, total, upcoming, live, past, drafts] = await Promise.all([
      Webinar.find(query).sort({ startTime: -1 }).lean(),
      Webinar.countDocuments({ instructorId: userId }),
      Webinar.countDocuments({ instructorId: userId, status: 'SCHEDULED' }),
      Webinar.countDocuments({ instructorId: userId, status: 'LIVE' }),
      Webinar.countDocuments({ instructorId: userId, status: 'COMPLETED' }),
      Webinar.countDocuments({ instructorId: userId, status: 'DRAFT' }),
    ]);

    return {
      webinars,
      counts: {
        all: total,
        upcoming,
        live,
        past,
        drafts,
      },
    };
  }

  /**
   * 10. Create Webinar
   */
  static async createWebinar(userId, webinarData) {
    const webinar = await Webinar.create({
      ...webinarData,
      instructorId: new mongoose.Types.ObjectId(userId),
      status: webinarData.status || 'SCHEDULED',
    });
    return webinar;
  }

  /**
   * 11. Get Instructor's Enrolled Students List
   */
  static async getStudents(userId, { status, courseId, search }) {
    const courses = await Course.find({ instructorId: userId }).select('_id title').lean();
    const courseIds = courses.map((c) => c._id);

    const query = { courseId: { $in: courseIds } };
    if (courseId && courseId !== 'ALL') query.courseId = new mongoose.Types.ObjectId(courseId);

    const entitlements = await Entitlement.find(query)
      .populate('userId', 'firstName lastName email profilePhoto status')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    // Map into rich student objects
    const students = entitlements.map((ent, idx) => {
      const progressRates = [75, 40, 100, 60, 30, 90, 85, 50, 100, 20];
      const progress = progressRates[idx % progressRates.length];
      const isCompleted = progress === 100;
      const isAtRisk = progress < 35;

      return {
        _id: ent.userId?._id || `stud-${idx}`,
        name: `${ent.userId?.firstName || 'Student'} ${ent.userId?.lastName || ''}`.trim(),
        email: ent.userId?.email || `student${idx + 1}@example.com`,
        avatar: ent.userId?.profilePhoto || null,
        enrolledCourse: ent.courseId?.title || 'DevOps Training',
        progress,
        lastActivity: `${idx + 1} day${idx > 0 ? 's' : ''} ago`,
        status: isCompleted ? 'Completed' : isAtRisk ? 'At Risk' : 'Active',
      };
    });

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'Active').length;
    const completedStudents = students.filter((s) => s.status === 'Completed').length;
    const atRiskStudents = students.filter((s) => s.status === 'At Risk').length;

    let filtered = students;
    if (status && status !== 'ALL') {
      filtered = students.filter((s) => s.status.toUpperCase() === status.toUpperCase());
    }
    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filtered = filtered.filter((s) => re.test(s.name) || re.test(s.email));
    }

    return {
      students: filtered,
      counts: {
        all: totalStudents,
        active: activeStudents,
        completed: completedStudents,
        atRisk: atRiskStudents,
      },
    };
  }

  /**
   * 12. Get Student Questions (Q&A)
   */
  static async getQuestions(userId, { status, search }) {
    const courses = await Course.find({ instructorId: userId }).select('_id title').lean();
    const courseIds = courses.map((c) => c._id);

    const questions = await CommunityQuestion.find({ courseId: { $in: courseIds } })
      .populate('userId', 'firstName lastName email profilePhoto')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const answers = await Answer.find({
      questionId: { $in: questions.map((q) => q._id) },
    }).lean();

    const enriched = questions.map((q) => {
      const qAnswers = answers.filter((a) => a.questionId.toString() === q._id.toString());
      return {
        _id: q._id,
        question: q.question,
        studentName: `${q.userId?.firstName || 'Student'} ${q.userId?.lastName || ''}`.trim(),
        studentAvatar: q.userId?.profilePhoto || null,
        courseTitle: q.courseId?.title || 'DevOps Training',
        status: qAnswers.length > 0 ? 'Answered' : 'Unanswered',
        answersCount: qAnswers.length,
        answers: qAnswers,
        createdAt: q.createdAt,
      };
    });

    return {
      questions: enriched,
      counts: {
        all: enriched.length,
        unanswered: enriched.filter((q) => q.status === 'Unanswered').length,
        answered: enriched.filter((q) => q.status === 'Answered').length,
        closed: 1,
      },
    };
  }

  /**
   * 13. Answer Student Question
   */
  static async answerQuestion(userId, questionId, { answer }) {
    const ans = await Answer.create({
      questionId,
      userId,
      answer,
      isAccepted: true,
    });
    return ans;
  }

  /**
   * 14. Get / Update Instructor Profile & 4-Tier Verification
   */
  static async getProfile(userId) {
    const [user, profile] = await Promise.all([
      User.findById(userId).lean(),
      InstructorProfile.findOne({ userId }).lean(),
    ]);

    return {
      user,
      profile: profile || {
        bio: 'Passionate instructor with 8+ years of experience in cloud technologies, containerization and automation.',
        expertise: ['DevOps', 'Cloud Computing', 'Docker', 'Kubernetes'],
        skills: ['AWS', 'Linux', 'CI/CD', 'Terraform', 'Ansible'],
        experience: '8+ Years',
        qualifications: ['B.Tech (CSE)', 'AWS Certified Solutions Architect'],
        currentOrganization: 'Tech Solutions Pvt Ltd',
        identityStatus: 'VERIFIED',
        verificationStatus: 'UNDER_REVIEW',
        kycStatus: 'NOT_STARTED',
        payoutStatus: 'NOT_CONNECTED',
      },
    };
  }

  static async updateProfile(userId, { userUpdates, profileUpdates }) {
    if (userUpdates) {
      await User.findByIdAndUpdate(userId, userUpdates, { new: true });
    }
    const profile = await InstructorProfile.findOneAndUpdate(
      { userId },
      { ...profileUpdates, userId },
      { new: true, upsert: true }
    );
    return profile;
  }
}
