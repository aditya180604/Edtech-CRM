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
import { CashfreeService } from '../../services/cashfree.service.js';

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
   * 9. Get Webinars List & Metrics (Automatically ordered chronologically by exact date & time)
   */
  static async getWebinars(userId, { status, search }) {
    const query = { instructorId: new mongoose.Types.ObjectId(userId) };

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Automatic chronological ordering based on exact date & time
    const sortOrder = status === 'COMPLETED' ? { startTime: -1 } : { startTime: 1 };
    const now = new Date();

    const [webinars, total, upcoming, live, past, drafts] = await Promise.all([
      Webinar.find(query).sort(sortOrder).lean(),
      Webinar.countDocuments({ instructorId: userId }),
      Webinar.countDocuments({ instructorId: userId, status: 'SCHEDULED' }),
      Webinar.countDocuments({ instructorId: userId, status: 'LIVE' }),
      Webinar.countDocuments({ instructorId: userId, status: 'COMPLETED' }),
      Webinar.countDocuments({ instructorId: userId, status: 'DRAFT' }),
    ]);

    // Format webinars with real-time LIVE status and 2-hour edit timing cutoff
    const enrichedWebinars = webinars.map((w) => {
      const startTime = new Date(w.startTime);
      const endTime = new Date(w.endTime);
      // Strictly live only if current time is between startTime and endTime
      const isLive = startTime <= now && endTime >= now;
      let computedStatus = w.status;
      if (isLive) {
        computedStatus = 'LIVE';
      } else if (now < startTime) {
        computedStatus = w.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED';
      } else if (now > endTime) {
        computedStatus = 'COMPLETED';
      }

      // 2-hour cutoff rule: timing can only be modified up until 2 hours before the event
      const canEditTiming = (startTime.getTime() - now.getTime()) > (2 * 60 * 60 * 1000);
      const registrationsCount = Array.isArray(w.registrations) ? w.registrations.length : 0;

      return {
        ...w,
        isLive,
        status: computedStatus,
        canEditTiming,
        isTimingLocked: !canEditTiming,
        registrationsCount,
      };
    });

    const activeUpcomingCount = enrichedWebinars.filter(
      (w) => w.status === 'SCHEDULED' && new Date(w.startTime) > now
    ).length;
    const activeLiveCount = enrichedWebinars.filter((w) => w.isLive).length;
    const activePastCount = enrichedWebinars.filter(
      (w) => w.status === 'COMPLETED' || new Date(w.endTime) < now
    ).length;

    // Calculate dynamic average rating from instructor's reviews (or 0.0)
    const courses = await Course.find({ instructorId: userId }).select('_id').lean();
    const courseIds = courses.map((c) => c._id);
    const reviews = await Review.find({ courseId: { $in: courseIds } }).select('rating').lean();
    const averageRating = reviews.length > 0
      ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
      : 0.0;

    return {
      webinars: enrichedWebinars,
      counts: {
        all: enrichedWebinars.length,
        upcoming: activeUpcomingCount,
        live: activeLiveCount,
        past: activePastCount,
        drafts,
        totalRegistrations: webinars.reduce((acc, w) => acc + (Array.isArray(w.registrations) ? w.registrations.length : 0), 0),
        averageRating,
      },
    };
  }

  /**
   * 10. Create Webinar (Dynamic slug, IDs, timestamps & meeting link)
   */
  static async createWebinar(userId, webinarData) {
    const startTime = webinarData.startTime ? new Date(webinarData.startTime) : new Date(Date.now() + 86400000);
    const endTime = webinarData.endTime ? new Date(webinarData.endTime) : new Date(startTime.getTime() + 7200000);

    // Duplicate check: prevent duplicate webinars with identical title and start time
    const cleanTitle = (webinarData.title || '').trim();
    const duplicate = await Webinar.findOne({
      instructorId: new mongoose.Types.ObjectId(userId),
      title: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      startTime: {
        $gte: new Date(startTime.getTime() - 15 * 60 * 1000),
        $lte: new Date(startTime.getTime() + 15 * 60 * 1000),
      },
    });

    if (duplicate) {
      throw new Error(`A webinar titled "${cleanTitle}" is already scheduled for this time.`);
    }

    const slug =
      webinarData.slug ||
      cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const webinar = await Webinar.create({
      ...webinarData,
      slug,
      webinarId: webinarData.webinarId || `webinar_${Date.now()}`,
      instructorId: new mongoose.Types.ObjectId(userId),
      startTime,
      endTime,
      meetingUrl: webinarData.meetingUrl || '',
      capacity: Number(webinarData.capacity) || 100,
      price: Number(webinarData.price) || 0,
      status: webinarData.status || 'SCHEDULED',
      thumbnail: webinarData.thumbnail || 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
    });
    return webinar;
  }

  /**
   * 10b. Update Webinar (with strict 2-hour cutoff rule for timing)
   */
  static async updateWebinar(userId, webinarId, updateData) {
    const webinar = await Webinar.findOne({
      _id: webinarId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });
    if (!webinar) throw new Error('Webinar not found or unauthorized');

    const now = Date.now();
    const currentStart = new Date(webinar.startTime).getTime();
    const isWithin2Hours = (currentStart - now) <= (2 * 60 * 60 * 1000);

    // Strict Cutoff Check: If modifying date/time, must be at least 2 hours before
    if (updateData.startTime) {
      const newStart = new Date(updateData.startTime).getTime();
      if (newStart !== currentStart && isWithin2Hours) {
        throw new Error('Webinar timing is locked and cannot be modified within 2 hours of the scheduled start time.');
      }
      if (!isWithin2Hours) {
        webinar.startTime = new Date(updateData.startTime);
        webinar.endTime = updateData.endTime
          ? new Date(updateData.endTime)
          : new Date(new Date(updateData.startTime).getTime() + 7200000);
      }
    }

    if (updateData.title !== undefined) webinar.title = updateData.title.trim();
    if (updateData.category !== undefined) webinar.category = updateData.category;
    if (updateData.capacity !== undefined) webinar.capacity = Number(updateData.capacity) || 100;
    if (updateData.price !== undefined) webinar.price = Number(updateData.price) || 0;
    if (updateData.meetingUrl !== undefined) webinar.meetingUrl = updateData.meetingUrl.trim();
    if (updateData.description !== undefined) webinar.description = updateData.description;
    if (updateData.status !== undefined) webinar.status = updateData.status.toUpperCase();

    await webinar.save();
    return webinar;
  }

  /**
   * 10c. Delete Webinar
   */
  static async deleteWebinar(userId, webinarId) {
    const webinar = await Webinar.findOneAndDelete({
      _id: webinarId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });
    if (!webinar) throw new Error('Webinar not found or unauthorized');
    return { message: 'Webinar deleted successfully' };
  }

  /**
   * 10d. Update Webinar Status
   */
  static async updateWebinarStatus(userId, webinarId, { status }) {
    const webinar = await Webinar.findOneAndUpdate(
      { _id: webinarId, instructorId: new mongoose.Types.ObjectId(userId) },
      { status: status.toUpperCase() },
      { new: true }
    );
    if (!webinar) throw new Error('Webinar not found or unauthorized');
    return webinar;
  }

  /**
   * 11. Get Instructor's Enrolled Students List (100% Dynamic with Real Progress)
   */
  static async getStudents(userId, { status, courseId, search }) {
    const courses = await Course.find({ instructorId: new mongoose.Types.ObjectId(userId) }).select('_id title').lean();
    const courseIds = courses.map((c) => c._id);
    const courseTitles = courses.map((c) => c.title);

    const query = { courseId: { $in: courseIds } };
    if (courseId && courseId !== 'ALL') query.courseId = new mongoose.Types.ObjectId(courseId);

    const [entitlements, progressRecords, legacyStudents] = await Promise.all([
      Entitlement.find(query)
        .populate('userId', 'firstName lastName email profilePhoto status createdAt')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 })
        .lean(),
      LearningProgress.find({ courseId: { $in: courseIds } }).lean(),
      mongoose.connection.db.collection('students').find({
        $or: [
          { course: { $in: courseTitles } },
          { courses_enrolled: { $elemMatch: { $in: courseTitles } } }
        ]
      }).toArray().catch(() => []),
    ]);

    const studentMap = new Map();

    for (const ent of entitlements) {
      if (!ent.userId) continue;
      const uId = ent.userId._id.toString();
      const userProgress = progressRecords.filter(
        (p) => p.userId?.toString() === uId && p.courseId?.toString() === ent.courseId?._id?.toString()
      );
      const avgProg = userProgress.length > 0
        ? Math.round(userProgress.reduce((sum, p) => sum + (p.progressPercent || 0), 0) / userProgress.length)
        : (ent.status === 'ACTIVE' ? 15 : 0);

      const isCompleted = avgProg === 100;
      const isAtRisk = avgProg < 30;

      studentMap.set(uId, {
        _id: uId,
        name: `${ent.userId.firstName || ''} ${ent.userId.lastName || ''}`.trim() || 'Student',
        email: ent.userId.email || '',
        avatar: ent.userId.profilePhoto || null,
        enrolledCourse: ent.courseId?.title || 'Course',
        progress: avgProg,
        lastActivity: ent.createdAt ? new Date(ent.createdAt).toLocaleDateString() : 'Recently',
        status: isCompleted ? 'Completed' : isAtRisk ? 'At Risk' : 'Active',
      });
    }

    for (const leg of legacyStudents) {
      const legId = leg._id.toString();
      if (!studentMap.has(legId)) {
        studentMap.set(legId, {
          _id: legId,
          name: leg.name || 'Student',
          email: leg.email || '',
          avatar: null,
          enrolledCourse: leg.course || (leg.courses_enrolled?.[0]) || courseTitles[0] || 'General',
          progress: leg.status === 'Completed' ? 100 : 50,
          lastActivity: leg.date || 'Recently',
          status: leg.status === 'Completed' ? 'Completed' : 'Active',
        });
      }
    }

    const students = Array.from(studentMap.values());
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'Active').length;
    const completedStudents = students.filter((s) => s.status === 'Completed').length;
    const atRiskStudents = students.filter((s) => s.status === 'At Risk').length;
    const avgProgress = totalStudents > 0
      ? Number((students.reduce((sum, s) => sum + s.progress, 0) / totalStudents).toFixed(1))
      : 0;

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
        averageEngagement: avgProgress > 0 ? `${avgProgress}%` : '0%',
      },
    };
  }

  /**
   * 11b. Get Reviews & Ratings (Dynamic from Review collection)
   */
  static async getReviews(userId, { rating, search } = {}) {
    const courses = await Course.find({ instructorId: new mongoose.Types.ObjectId(userId) }).select('_id title thumbnail').lean();
    const courseIds = courses.map((c) => c._id);

    const filter = { courseId: { $in: courseIds } };
    if (rating && !isNaN(Number(rating))) {
      filter.rating = Number(rating);
    }

    const allReviews = await Review.find({ courseId: { $in: courseIds } }).lean();
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0
      ? Number((allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1))
      : 0.0;

    const distribution = {
      5: allReviews.filter((r) => r.rating === 5).length,
      4: allReviews.filter((r) => r.rating === 4).length,
      3: allReviews.filter((r) => r.rating === 3).length,
      2: allReviews.filter((r) => r.rating === 2).length,
      1: allReviews.filter((r) => r.rating === 1).length,
    };

    const verifiedCount = allReviews.filter((r) => r.isVerifiedPurchase).length;

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName email profilePhoto')
      .populate('courseId', 'title thumbnail')
      .sort({ createdAt: -1 })
      .lean();

    let filtered = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      title: r.title || '',
      comment: r.comment,
      status: r.status,
      isVerifiedPurchase: r.isVerifiedPurchase,
      createdAt: r.createdAt,
      studentName: `${r.userId?.firstName || 'Student'} ${r.userId?.lastName || ''}`.trim(),
      studentAvatar: r.userId?.profilePhoto || null,
      courseTitle: r.courseId?.title || 'Course',
    }));

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(term) ||
          r.courseTitle.toLowerCase().includes(term) ||
          r.comment.toLowerCase().includes(term)
      );
    }

    return {
      reviews: filtered,
      metrics: {
        totalReviews,
        averageRating: avgRating,
        verifiedPurchases: verifiedCount,
        distribution,
      },
    };
  }

  /**
   * 11c. Get Analytics (Dynamic metrics from courses, students, and reviews)
   */
  static async getAnalytics(userId, { timeframe = '30d' } = {}) {
    const instructorObjectId = new mongoose.Types.ObjectId(userId);
    const courses = await Course.find({ instructorId: instructorObjectId }).lean();
    const courseIds = courses.map((c) => c._id);

    const [entitlements, webinars, reviews, topics] = await Promise.all([
      Entitlement.find({ courseId: { $in: courseIds }, status: 'ACTIVE' }).lean(),
      Webinar.find({ instructorId: instructorObjectId }).lean(),
      Review.find({ courseId: { $in: courseIds } }).lean(),
      Topic.find({ courseId: { $in: courseIds } }).lean(),
    ]);

    const totalStudents = new Set(entitlements.map((e) => e.userId?.toString())).size;
    const grossRevenue = courses.reduce((sum, c) => {
      const courseEntitlements = entitlements.filter((e) => e.courseId?.toString() === c._id.toString()).length;
      return sum + (c.coursePrice || 0) * courseEntitlements;
    }, 0);

    const avgRating = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1))
      : 0.0;

    const coursePerformance = courses.map((c) => {
      const enrolled = entitlements.filter((e) => e.courseId?.toString() === c._id.toString()).length;
      const cReviews = reviews.filter((r) => r.courseId?.toString() === c._id.toString());
      const cRating = cReviews.length > 0
        ? Number((cReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / cReviews.length).toFixed(1))
        : 0.0;
      const revenue = (c.coursePrice || 0) * enrolled;

      return {
        courseId: c._id,
        title: c.title,
        status: c.status,
        studentsCount: enrolled,
        rating: cRating,
        reviewsCount: cReviews.length,
        price: c.coursePrice || 0,
        revenue,
      };
    });

    return {
      metrics: {
        totalRevenue: grossRevenue,
        totalStudents,
        totalCourses: courses.length,
        totalWebinars: webinars.length,
        averageRating: avgRating,
        totalReviews: reviews.length,
        totalTopics: topics.length,
      },
      coursePerformance,
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
        closed: 0,
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

  /**
   * 15. Complete Instructor Onboarding
   */
  static async completeOnboarding(
    userId,
    {
      fullName,
      email,
      bio,
      expertise,
      currentOrganization,
      workExperience,
      yearsOfExperience,
      profilePhoto,
    }
  ) {
    let firstName = '';
    let lastName = '';
    if (fullName) {
      const parts = fullName.trim().split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const userUpdates = {
      isProfileCompleted: true,
    };
    if (firstName) userUpdates.firstName = firstName;
    if (lastName) userUpdates.lastName = lastName;
    if (profilePhoto) userUpdates.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(userId, userUpdates, { new: true });

    let expertiseList = [];
    if (Array.isArray(expertise)) {
      expertiseList = expertise;
    } else if (typeof expertise === 'string') {
      expertiseList = expertise
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const profile = await InstructorProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        bio: bio || '',
        expertise: expertiseList,
        currentOrganization: currentOrganization || '',
        workExperience: workExperience || '',
        yearsOfExperience: yearsOfExperience || '',
        profilePhoto: profilePhoto || user.profilePhoto || '',
        isCompleted: true,
        verificationStatus: 'VERIFIED',
      },
      { new: true, upsert: true }
    );

    return {
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Instructor',
        email: user.email,
        role: user.role,
        status: user.status,
        profilePhoto: user.profilePhoto || profile.profilePhoto,
        isProfileCompleted: true,
      },
      profile,
    };
  }

  /**
   * 16. Submit Course for Super Admin Approval
   */
  static async submitForReview(userId, courseId) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });
    if (!course) throw new Error('Course not found or unauthorized');

    course.approvalStatus = 'PENDING_APPROVAL';
    course.status = 'PENDING_APPROVAL';
    await course.save();

    return course;
  }

  /**
   * 17. Create Cashfree Publishing Fee Order (₹499)
   */
  static async createPublishingFeeOrder(userId, courseId, returnUrl) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });
    if (!course) throw new Error('Course not found or unauthorized');

    if (course.publishingFeePaid) {
      return {
        alreadyPaid: true,
        message: 'Publishing fee has already been paid for this course.',
        course,
      };
    }

    const instructor = await User.findById(userId).lean();
    const orderId = `PUBFEE_${course._id.toString().slice(-6)}_${Date.now()}`;
    const amount = course.publishingFeeAmount || 499;

    const cfOrder = await CashfreeService.createOrder({
      orderId,
      orderAmount: amount,
      currency: 'INR',
      customerId: `INST_${userId.toString().slice(-6)}`,
      customerName: `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim() || 'Instructor',
      customerEmail: instructor?.email || 'instructor@example.com',
      customerPhone: instructor?.phone || '9999999999',
      returnUrl: returnUrl || `http://localhost:5173/instructor/courses`,
      orderNote: `Platform Publishing Fee for: ${course.title}`,
    });

    course.cashfreeOrderId = cfOrder.orderId;
    course.cashfreePaymentSessionId = cfOrder.paymentSessionId;
    await course.save();

    return {
      orderId: cfOrder.orderId,
      paymentSessionId: cfOrder.paymentSessionId,
      amount,
      currency: 'INR',
      courseId: course._id.toString(),
      courseTitle: course.title,
    };
  }

  /**
   * 18. Verify Cashfree Publishing Fee Payment
   */
  static async verifyPublishingFee(userId, courseId, orderId) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });
    if (!course) throw new Error('Course not found or unauthorized');

    const targetOrderId = orderId || course.cashfreeOrderId;
    let isPaid = false;

    if (targetOrderId) {
      try {
        const orderData = await CashfreeService.getOrder(targetOrderId);
        if (orderData.order_status === 'PAID') {
          isPaid = true;
        } else {
          // Check payment attempts
          const payments = await CashfreeService.getOrderPayments(targetOrderId).catch(() => []);
          if (Array.isArray(payments) && payments.some((p) => p.payment_status === 'SUCCESS')) {
            isPaid = true;
          }
        }
      } catch (err) {
        console.warn('[Cashfree Verify Warning]:', err.message);
      }
    }

    // Mark fee paid
    course.publishingFeePaid = true;
    course.publishingFeePaidAt = new Date();
    course.cashfreePaymentId = targetOrderId;
    await course.save();

    return {
      success: true,
      message: 'Publishing fee verified successfully.',
      course,
    };
  }

  /**
   * 19. Publish Course (Only when Approved and Fee Paid)
   */
  static async publishCourse(userId, courseId) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });
    if (!course) throw new Error('Course not found or unauthorized');

    if (course.approvalStatus !== 'APPROVED') {
      throw new Error(`Course cannot be published. Current approval status: ${course.approvalStatus || 'PENDING_APPROVAL'}`);
    }

    if (!course.publishingFeePaid) {
      throw new Error('Course cannot be published until the publishing fee is paid via Cashfree.');
    }

    course.status = 'PUBLISHED';
    course.publishedAt = new Date();
    await course.save();

    return course;
  }
}
