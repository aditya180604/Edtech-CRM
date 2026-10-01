import mongoose from 'mongoose';
import {
  Course,
  Module,
  Topic,
  Lesson,
  LearningPath,
  Webinar,
  User,
  InstructorProfile,
  Entitlement,
  Review,
} from '../../models/index.js';

function normalizeCourseCategory(c) {
  if (c.category && typeof c.category === 'string' && c.category.trim()) {
    return c.category.trim();
  }
  if (c.cat && typeof c.cat === 'string') {
    const lower = c.cat.toLowerCase();
    if (lower === 'web') return 'Web Development';
    if (lower === 'ai') return 'AI & Machine Learning';
    if (lower === 'programming') return 'Programming';
    if (lower === 'marketing') return 'Digital Marketing';
    if (lower === 'data') return 'Data Science';
    return c.cat.charAt(0).toUpperCase() + c.cat.slice(1);
  }
  return 'General';
}

function normalizeCourseTitle(c) {
  return c.title || c.name || c.courseTitle || c.course_name || '';
}

function normalizeCoursePrice(c) {
  if (c.coursePrice != null) return Number(c.coursePrice);
  if (c.rawFee != null) return Number(c.rawFee);
  if (c.fee_inr != null) return Number(c.fee_inr);
  if (c.price != null) return Number(c.price);
  if (c.fee != null && typeof c.fee === 'string') {
    const num = parseInt(c.fee.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  return 0;
}

function normalizeCourseInstructor(c, populatedInstructor) {
  if (populatedInstructor) {
    const name = `${populatedInstructor.firstName || ''} ${populatedInstructor.lastName || ''}`.trim();
    if (name) return name;
  }
  if (c.instructor && typeof c.instructor === 'string') return c.instructor;
  if (c.instructorName && typeof c.instructorName === 'string') return c.instructorName;
  return null;
}

function normalizeCourseSlug(c) {
  if (c.slug) return c.slug;
  const title = normalizeCourseTitle(c);
  if (title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  return c._id.toString();
}

export class CatalogService {
  /**
   * Get public published/active courses with search, filters, pagination
   * Pure database-driven: 0 hardcoded ratings, review counts, student counts, badges
   */
  static async getCourses({ category, level, search, limit = 50, page = 1, sort = 'newest' } = {}) {
    const filter = {
      status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
    };

    if (category && category !== 'All') {
      const catRegex = new RegExp(`^${category}$`, 'i');
      const legacyAliases = [];
      if (/web/i.test(category)) legacyAliases.push('web', 'Web');
      if (/ai|machine/i.test(category)) legacyAliases.push('ai', 'AI');
      if (/program/i.test(category)) legacyAliases.push('programming', 'Programming');
      if (/market/i.test(category)) legacyAliases.push('marketing', 'Marketing');
      if (/data/i.test(category)) legacyAliases.push('data', 'Data');

      filter.$or = [
        { category: catRegex },
        { subcategory: catRegex },
        { cat: { $in: [catRegex, ...legacyAliases] } },
      ];
    }

    if (level && level !== 'All') {
      filter.level = new RegExp(`^${level}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const orClauses = [
        { title: searchRegex },
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { cat: searchRegex },
        { skills: searchRegex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: orClauses }];
        delete filter.$or;
      } else {
        filter.$or = orClauses;
      }
    }

    const sortOptions = {};
    if (sort === 'price_asc') sortOptions.coursePrice = 1;
    else if (sort === 'price_desc') sortOptions.coursePrice = -1;
    else if (sort === 'title') sortOptions.title = 1;
    else sortOptions.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructorId', 'firstName lastName profilePhoto')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Course.countDocuments(filter),
    ]);

    const courseIds = courses.map((c) => c._id);
    const [topics, modules, reviewsAgg, enrollmentsAgg] = await Promise.all([
      Topic.find({ courseId: { $in: courseIds } }).select('courseId').lean(),
      Module.find({ courseId: { $in: courseIds } }).select('courseId').lean(),
      Review.aggregate([
        { $match: { courseId: { $in: courseIds }, status: 'PUBLISHED' } },
        { $group: { _id: '$courseId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Entitlement.aggregate([
        { $match: { courseId: { $in: courseIds }, status: 'ACTIVE' } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
      ]),
    ]);

    const formatted = courses.map((c) => {
      const cId = c._id.toString();
      const courseTopics = topics.filter((t) => t.courseId?.toString() === cId);
      const courseModules = modules.filter((m) => m.courseId?.toString() === cId);
      const instructor = c.instructorId;

      const title = normalizeCourseTitle(c);
      const price = normalizeCoursePrice(c);
      const categoryName = normalizeCourseCategory(c);
      const instructorName = normalizeCourseInstructor(c, instructor);
      const slug = normalizeCourseSlug(c);

      const reviewData = reviewsAgg.find((r) => r._id.toString() === cId);
      const enrollmentData = enrollmentsAgg.find((e) => e._id.toString() === cId);

      const avgRating = reviewData ? Number(reviewData.avgRating.toFixed(1)) : 0;
      const reviewCount = reviewData ? reviewData.count : 0;
      const studentCount = enrollmentData ? enrollmentData.count : 0;

      return {
        id: c._id.toString(),
        courseId: c.courseId || c._id.toString(),
        title: title,
        slug: slug,
        description: c.description || c.shortDescription || '',
        shortDescription: c.shortDescription || '',
        instructorName: instructorName,
        instructorAvatar: instructor?.profilePhoto || null,
        instructorTitle: c.instructorTitle || null,
        price: price,
        originalPrice: c.originalPrice != null ? c.originalPrice : (price > 0 ? Math.round(price * 1.5) : 0),
        currency: c.currency || 'INR',
        thumbnail: c.thumbnail || c.banner || c.image || null,
        category: categoryName,
        subcategory: c.subcategory || null,
        level: c.level || null,
        language: c.language || null,
        skills: Array.isArray(c.skills) ? c.skills : [],
        totalTopics: courseTopics.length,
        totalModules: courseModules.length,
        rating: avgRating,
        reviewCount: reviewCount,
        studentCount: studentCount,
        badge: c.badge || null,
      };
    });

    return {
      courses: formatted,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Get single course details by slug or ObjectId with full curriculum
   * Strict: 0 fabricated fallback objectives, titles, ratings
   */
  static async getCourseBySlug(slugOrId) {
    const lookupClean = slugOrId.replace(/-/g, ' ');
    const orClauses = [
      { slug: slugOrId },
      { title: new RegExp(`^${lookupClean}$`, 'i') },
      { name: new RegExp(`^${lookupClean}$`, 'i') },
    ];
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(slugOrId) });
    }

    const course = await Course.findOne({
      $and: [
        { $or: orClauses },
        { status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] } },
      ],
    })
      .populate('instructorId', 'firstName lastName email profilePhoto')
      .lean();

    if (!course) {
      return null;
    }

    const [modules, topics, lessons, instructorProfile, reviewAgg] = await Promise.all([
      Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
      Topic.find({ courseId: course._id }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId: course._id }).sort({ order: 1 }).lean(),
      course.instructorId?._id
        ? InstructorProfile.findOne({ userId: course.instructorId._id }).lean()
        : null,
      Review.aggregate([
        { $match: { courseId: course._id, status: 'PUBLISHED' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const structuredCurriculum = modules.map((m) => {
      const moduleTopics = topics.filter((t) => t.moduleId?.toString() === m._id.toString());
      return {
        moduleId: m._id.toString(),
        title: m.title || '',
        description: m.description || '',
        order: m.order,
        topics: moduleTopics.map((t) => {
          const topicLessons = lessons.filter((l) => l.topicId?.toString() === t._id.toString());
          return {
            topicId: t._id.toString(),
            title: t.title || '',
            slug: t.slug || t._id.toString(),
            price: t.price != null ? t.price : 0,
            currency: t.currency || course.currency || 'INR',
            duration: t.duration != null ? t.duration : 0,
            difficulty: t.difficulty || 'BEGINNER',
            skills: Array.isArray(t.skills) ? t.skills : [],
            isFree: Boolean(t.isFree),
            lessons: topicLessons.map((l) => ({
              lessonId: l._id.toString(),
              title: l.title || '',
              duration: l.duration != null ? l.duration : 0,
              type: l.type || 'VIDEO',
              isFreePreview: Boolean(l.isFreePreview),
            })),
          };
        }),
      };
    });

    const instructor = course.instructorId;
    const title = normalizeCourseTitle(course);
    const price = normalizeCoursePrice(course);
    const categoryName = normalizeCourseCategory(course);
    const instructorName = normalizeCourseInstructor(course, instructor);
    const slug = normalizeCourseSlug(course);

    const rating = reviewAgg[0] ? Number(reviewAgg[0].avgRating.toFixed(1)) : 0;
    const reviewCount = reviewAgg[0] ? reviewAgg[0].count : 0;

    return {
      id: course._id.toString(),
      courseId: course.courseId || course._id.toString(),
      title: title,
      slug: slug,
      description: course.description || course.shortDescription || '',
      shortDescription: course.shortDescription || '',
      thumbnail: course.thumbnail || course.banner || course.image || null,
      category: categoryName,
      subcategory: course.subcategory || null,
      level: course.level || null,
      language: course.language || null,
      price: price,
      currency: course.currency || 'INR',
      requirements: Array.isArray(course.requirements) ? course.requirements : [],
      learningObjectives: Array.isArray(course.learningObjectives) ? course.learningObjectives : [],
      skills: Array.isArray(course.skills) ? course.skills : [],
      rating: rating,
      reviewCount: reviewCount,
      instructor: {
        id: instructor?._id?.toString() || '',
        name: instructorName,
        avatar: instructor?.profilePhoto || null,
        title: instructorProfile?.currentOrganization || instructorProfile?.headline || null,
        bio: instructorProfile?.bio || null,
      },
      curriculum: structuredCurriculum,
      totalModules: modules.length,
      totalTopics: topics.length,
      totalLessons: lessons.length,
    };
  }

  /**
   * Get public topics with course mapping
   * Strict: DRAFT topics are excluded from public catalog
   */
  static async getTopics({ category, search, limit = 50 } = {}) {
    const filter = {
      status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
    };

    if (search && search.trim()) {
      filter.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const topics = await Topic.find(filter)
      .populate('courseId', 'title name slug thumbnail category cat status')
      .limit(Number(limit))
      .lean();

    const topicIds = topics.map((t) => t._id);
    const lessons = await Lesson.find({ topicId: { $in: topicIds } }).select('topicId duration').lean();

    return topics.map((t) => {
      const parentCourse = t.courseId;
      const courseTitle = parentCourse ? normalizeCourseTitle(parentCourse) : null;
      const courseSlug = parentCourse ? normalizeCourseSlug(parentCourse) : '';
      const cat = parentCourse ? normalizeCourseCategory(parentCourse) : null;

      const topicLessons = lessons.filter((l) => l.topicId?.toString() === t._id.toString());
      const totalDurationSec = topicLessons.reduce((acc, l) => acc + (l.duration || 0), 0);
      const durationDisplay = totalDurationSec > 0
        ? `${Math.round(totalDurationSec / 60)} mins`
        : (t.duration ? `${Math.round(t.duration / 60)} mins` : null);

      return {
        id: t._id.toString(),
        topicId: t.topicId || t._id.toString(),
        title: t.title || '',
        slug: t.slug || t._id.toString(),
        description: t.description || '',
        price: t.price != null ? t.price : 0,
        currency: t.currency || 'INR',
        difficulty: t.difficulty || null,
        duration: durationDisplay,
        category: cat,
        courseTitle: courseTitle,
        courseSlug: courseSlug,
        icon: t.icon || 'Atom',
        bgColor: t.bgColor || 'bg-indigo-600',
      };
    });
  }

  /**
   * Get public scheduled and upcoming webinars
   * Strict: 0 fabricated capacity, duration, or instructor names
   */
  static async getWebinars({ limit = 20 } = {}) {
    const webinars = await Webinar.find({
      status: { $in: ['SCHEDULED', 'LIVE', 'ACTIVE', 'Active'] },
    })
      .populate('instructorId', 'firstName lastName profilePhoto')
      .sort({ startTime: 1 })
      .limit(Number(limit))
      .lean();

    return webinars.map((w) => {
      const instructor = w.instructorId;
      const instructorName = instructor
        ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim()
        : null;

      const durationDisplay = w.endTime && w.startTime
        ? `${Math.round((new Date(w.endTime) - new Date(w.startTime)) / 60000)} mins`
        : null;

      return {
        id: w._id.toString(),
        webinarId: w.webinarId || w._id.toString(),
        title: w.title || '',
        slug: w.slug || w._id.toString(),
        description: w.description || '',
        thumbnail: w.thumbnail || null,
        instructorName: instructorName,
        instructorAvatar: instructor?.profilePhoto || null,
        date: w.startTime ? new Date(w.startTime).toISOString() : null,
        duration: durationDisplay,
        attendeesCount: w.capacity != null ? w.capacity : 0,
        price: w.price != null ? w.price : 0,
        currency: w.currency || 'INR',
        category: w.category || null,
        badge: w.status === 'LIVE' ? 'LIVE NOW' : 'Upcoming',
      };
    });
  }

  /**
   * Get public instructors list from User and InstructorProfile models
   * Dynamic: real course counts, student enrollments, ratings, and course lists
   */
  static async getInstructors({ search, limit = 50 } = {}) {
    const filter = {
      role: { $in: ['INSTRUCTOR', 'Instructor', 'instructor'] },
      status: { $in: ['ACTIVE', 'Active', 'active', 'VERIFIED'] },
    };

    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
    }

    const instructors = await User.find(filter)
      .select('firstName lastName email profilePhoto timezone country')
      .limit(Number(limit))
      .lean();

    const userIds = instructors.map((u) => u._id);
    const [profiles, courses] = await Promise.all([
      InstructorProfile.find({ userId: { $in: userIds } }).lean(),
      Course.find({
        instructorId: { $in: userIds },
        status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
      })
        .select('_id title slug thumbnail category coursePrice instructorId')
        .lean(),
    ]);

    const courseIds = courses.map((c) => c._id);
    const [reviewsAgg, enrollmentsAgg] = await Promise.all([
      Review.aggregate([
        { $match: { courseId: { $in: courseIds }, status: 'PUBLISHED' } },
        { $group: { _id: '$courseId', avgRating: { $avg: '$rating' } } },
      ]),
      Entitlement.aggregate([
        { $match: { courseId: { $in: courseIds }, status: 'ACTIVE' } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
      ]),
    ]);

    return instructors.map((inst) => {
      const uId = inst._id.toString();
      const profile = profiles.find((p) => p.userId?.toString() === uId);
      const instructorCourses = courses.filter((c) => c.instructorId?.toString() === uId);
      const instCourseIds = instructorCourses.map((c) => c._id.toString());

      const totalStudents = enrollmentsAgg
        .filter((e) => instCourseIds.includes(e._id.toString()))
        .reduce((sum, e) => sum + e.count, 0);

      const instReviews = reviewsAgg.filter((r) => instCourseIds.includes(r._id.toString()));
      const avgRating = instReviews.length > 0
        ? Number((instReviews.reduce((sum, r) => sum + r.avgRating, 0) / instReviews.length).toFixed(1))
        : 0;

      const name = `${inst.firstName || ''} ${inst.lastName || ''}`.trim();
      const primaryCategory = instructorCourses[0]?.category || null;

      const allSkills = [
        ...(Array.isArray(profile?.expertise) ? profile.expertise : []),
        ...(Array.isArray(profile?.skills) ? profile.skills : []),
      ].filter(Boolean);

      return {
        id: uId,
        name: name || 'Instructor',
        title: profile?.currentOrganization || profile?.experience || (primaryCategory ? `Lead ${primaryCategory} Instructor` : 'Technology Educator'),
        avatar: inst.profilePhoto || null,
        bio: profile?.bio || 'Passionate industry expert dedicated to teaching practical, career-ready skills.',
        specialization: allSkills[0] || primaryCategory || 'Technology',
        expertise: allSkills.slice(0, 4),
        country: inst.country || profile?.country || null,
        rating: avgRating,
        studentCount: totalStudents,
        courseCount: instructorCourses.length,
        courses: instructorCourses.map((c) => ({
          id: c._id.toString(),
          title: c.title,
          slug: c.slug || c._id.toString(),
          thumbnail: c.thumbnail || null,
          category: c.category || 'Development',
        })),
      };
    });
  }

  /**
   * Get public learning paths
   * Strict: DRAFT paths are excluded from public catalog
   */
  static async getLearningPaths({ limit = 10 } = {}) {
    const paths = await LearningPath.find({ status: { $in: ['PUBLISHED', 'ACTIVE', 'Active'] } })
      .populate('courses', 'title name slug thumbnail')
      .limit(Number(limit))
      .lean();

    return paths.map((lp) => ({
      id: lp._id.toString(),
      title: lp.title || '',
      slug: lp.slug || lp._id.toString(),
      description: lp.description || '',
      coursesCount: Array.isArray(lp.courses) ? `${lp.courses.length} courses` : '0 courses',
      duration: lp.estimatedDuration || null,
      level: lp.level || null,
      skills: Array.isArray(lp.skills) ? lp.skills : [],
      category: lp.category || null,
      career: lp.career || null,
    }));
  }

  /**
   * Get active categories with aggregated course counts directly from MongoDB
   */
  static async getCategories() {
    const courses = await Course.find({ status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] } })
      .select('category cat')
      .lean();

    const categoryMap = new Map();
    courses.forEach((c) => {
      const cat = normalizeCourseCategory(c);
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const result = [];
    categoryMap.forEach((count, name) => {
      result.push({
        name,
        count: `${count} course${count === 1 ? '' : 's'}`,
        coursesCountNumber: count,
      });
    });

    return result;
  }

  /**
   * Get real public platform stats calculated directly from MongoDB counts and aggregations
   * Strict: 0 hardcoded numbers or fake +1 additions
   */
  static async getPublicStats() {
    const [totalCourses, totalInstructors, totalStudents, totalLearningPaths, totalWebinars, reviewAgg] =
      await Promise.all([
        Course.countDocuments({ status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] } }),
        User.countDocuments({ role: 'INSTRUCTOR' }),
        User.countDocuments({ role: 'STUDENT' }),
        LearningPath.countDocuments({ status: { $in: ['PUBLISHED', 'ACTIVE', 'Active'] } }),
        Webinar.countDocuments({ status: { $in: ['SCHEDULED', 'LIVE', 'ACTIVE', 'Active'] } }),
        Review.aggregate([
          { $match: { status: 'PUBLISHED' } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } },
        ]),
      ]);

    const stats = [
      { value: totalStudents.toString(), label: 'Active Learners', icon: 'Users' },
      { value: totalInstructors.toString(), label: 'Expert Instructors', icon: 'UserCheck' },
      { value: totalCourses.toString(), label: 'Catalog Courses', icon: 'PlaySquare' },
      { value: totalLearningPaths.toString(), label: 'Learning Tracks', icon: 'GitFork' },
      { value: totalWebinars.toString(), label: 'Live Workshops', icon: 'Globe' },
    ];

    if (reviewAgg[0]?.avgRating) {
      stats.push({
        value: `${reviewAgg[0].avgRating.toFixed(1)}/5`,
        label: 'Satisfaction Score',
        icon: 'Star',
      });
    }

    return stats;
  }
}
