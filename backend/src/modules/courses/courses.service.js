import mongoose from 'mongoose';
import { Course, Module, Topic, Lesson, Resource, User, Review, Entitlement, InstructorProfile } from '../../models/index.js';
import { ENTITLEMENT_STATUS, PRODUCT_TYPES } from '../../config/constants.js';

export class CoursesService {
  /**
   * 1. Featured Courses for Home Page (Image 4)
   */
  static async getFeaturedCourses(limit = 8, userId = null) {
    const courses = await Course.find({ status: 'PUBLISHED' })
      .populate('instructorId', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10) || 8)
      .lean();

    const courseIds = courses.map((c) => c._id);
    const enrolledCourseIdSet = new Set();

    if (userId && mongoose.isValidObjectId(userId)) {
      const entitlements = await Entitlement.find({
        userId,
        status: ENTITLEMENT_STATUS.ACTIVE,
        $or: [
          { productId: { $in: courseIds } },
          { courseId: { $in: courseIds } },
        ],
      }).lean();

      entitlements.forEach((e) => {
        if (e.productId) enrolledCourseIdSet.add(e.productId.toString());
        if (e.courseId) enrolledCourseIdSet.add(e.courseId.toString());
      });
    }

    const badges = ['BEST SELLER', 'POPULAR', 'HOT & NEW', 'TOP RATED'];

    return courses.map((c, idx) => {
      const isEnrolled = enrolledCourseIdSet.has(c._id.toString());
      return {
        id: c._id.toString(),
        _id: c._id.toString(),
        title: c.title,
        slug: c.slug || c._id.toString(),
        instructorName: [c.instructorId?.firstName, c.instructorId?.lastName].filter(Boolean).join(' ') || 'Instructor',
        instructorAvatar: c.instructorId?.profilePhoto || null,
        rating: 4.8,
        reviewCount: '12K',
        price: c.coursePrice || 1999,
        originalPrice: Math.round((c.coursePrice || 1999) * 2.5),
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
        category: (c.category || 'DEVELOPMENT').toUpperCase(),
        level: c.level || 'Beginner',
        badge: badges[idx % badges.length],
        shortDescription: c.shortDescription || c.description,
        isEnrolled,
        isOwned: isEnrolled,
      };
    });
  }

  /**
   * 2. Catalog & Dynamic Filtering (Image 5)
   */
  static async getCatalog({ category, level, search, sort = 'newest', page = 1, limit = 20 } = {}, userId = null) {
    const query = { status: 'PUBLISHED' };

    if (category && category !== 'All' && category !== 'ALL') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (level && level !== 'All' && level !== 'ALL') {
      query.level = { $regex: new RegExp(`^${level}$`, 'i') };
    }

    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      query.$or = [{ title: re }, { shortDescription: re }, { category: re }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortObj = {};
    if (sort === 'price-low') sortObj.coursePrice = 1;
    else if (sort === 'price-high') sortObj.coursePrice = -1;
    else if (sort === 'rating') sortObj.createdAt = -1;
    else sortObj.createdAt = -1;

    const [courses, total, allPublished] = await Promise.all([
      Course.find(query)
        .populate('instructorId', 'firstName lastName profilePhoto')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Course.countDocuments(query),
      Course.find({ status: 'PUBLISHED' }).select('category level').lean(),
    ]);

    const courseIds = courses.map((c) => c._id);
    const enrolledCourseIdSet = new Set();

    if (userId && mongoose.isValidObjectId(userId)) {
      const entitlements = await Entitlement.find({
        userId,
        status: ENTITLEMENT_STATUS.ACTIVE,
        $or: [
          { productId: { $in: courseIds } },
          { courseId: { $in: courseIds } },
        ],
      }).lean();

      entitlements.forEach((e) => {
        if (e.productId) enrolledCourseIdSet.add(e.productId.toString());
        if (e.courseId) enrolledCourseIdSet.add(e.courseId.toString());
      });
    }

    // Dynamically calculate category counts for sidebar filter (Image 5)
    const categoryCountMap = {};
    const levelCountMap = {};

    allPublished.forEach((c) => {
      const cat = c.category || 'Development';
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;

      const lvl = c.level || 'Beginner';
      levelCountMap[lvl] = (levelCountMap[lvl] || 0) + 1;
    });

    const categoriesFilter = [
      { name: 'All', count: allPublished.length },
      ...Object.entries(categoryCountMap).map(([name, count]) => ({ name, count })),
    ];

    const levelsFilter = [
      { name: 'All', count: allPublished.length },
      { name: 'Beginner', count: levelCountMap['Beginner'] || 0 },
      { name: 'Intermediate', count: levelCountMap['Intermediate'] || 0 },
      { name: 'Advanced', count: levelCountMap['Advanced'] || 0 },
    ];

    const formatted = courses.map((c, idx) => {
      const isEnrolled = enrolledCourseIdSet.has(c._id.toString());
      return {
        id: c._id.toString(),
        _id: c._id.toString(),
        title: c.title,
        slug: c.slug || c._id.toString(),
        instructorName: `${c.instructorId?.firstName || 'Instructor'} ${c.instructorId?.lastName || ''}`.trim(),
        instructorAvatar: c.instructorId?.profilePhoto || null,
        rating: 4.8,
        reviewCount: '10K',
        price: c.coursePrice || 1999,
        originalPrice: Math.round((c.coursePrice || 1999) * 2.2),
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
        category: (c.category || 'Development').toUpperCase(),
        level: c.level || 'Beginner',
        shortDescription: c.shortDescription || c.description,
        isEnrolled,
        isOwned: isEnrolled,
      };
    });

    return {
      courses: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
      filters: {
        categories: categoriesFilter,
        levels: levelsFilter,
      },
    };
  }

  /**
   * 3. Course Details & Complete Syllabus Hierarchy (Image 5 Syllabus Section)
   */
  static async getCourseDetails(slugOrId, userId = null) {
    let query = { slug: slugOrId.toLowerCase() };
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      query = { $or: [{ slug: slugOrId.toLowerCase() }, { _id: slugOrId }] };
    }

    const course = await Course.findOne(query)
      .populate('instructorId', 'firstName lastName email profilePhoto')
      .lean();

    if (!course) return null;

    // Fetch Syllabus and InstructorProfile concurrently
    const [modules, instructorProfile] = await Promise.all([
      Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
      course.instructorId?._id
        ? InstructorProfile.findOne({ userId: course.instructorId._id }).lean()
        : null,
    ]);
    const moduleIds = modules.map((m) => m._id);
    const topics = await Topic.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean();
    const topicIds = topics.map((t) => t._id);
    const lessons = await Lesson.find({ topicId: { $in: topicIds } }).sort({ order: 1 }).lean();

    // Check user active entitlements if authenticated
    let isEnrolled = false;
    let enrolledTopicsCount = 0;
    const entitledTopicIdSet = new Set();

    if (userId && mongoose.isValidObjectId(userId)) {
      const activeEntitlements = await Entitlement.find({
        userId,
        status: ENTITLEMENT_STATUS.ACTIVE,
        $or: [
          { productId: course._id },
          { courseId: course._id },
        ],
      }).lean();

      for (const ent of activeEntitlements) {
        if (ent.productType === PRODUCT_TYPES.COURSE || ent.productId?.toString() === course._id.toString()) {
          isEnrolled = true;
        } else if (ent.topicId || ent.productId) {
          entitledTopicIdSet.add((ent.topicId || ent.productId).toString());
        }
      }

      enrolledTopicsCount = isEnrolled ? topics.length : entitledTopicIdSet.size;
    }

    const syllabus = modules.map((mod) => {
      const modTopics = topics.filter((t) => t.moduleId.toString() === mod._id.toString());
      const modTopicIds = modTopics.map((t) => t._id.toString());
      const modLessons = lessons.filter((l) => modTopicIds.includes(l.topicId.toString()));
      const durationSum = modTopics.reduce((acc, t) => acc + (t.duration || 30), 0);

      return {
        _id: mod._id,
        title: mod.title,
        order: mod.order,
        topicsCount: modTopics.length,
        lessonsCount: modLessons.length || (modTopics.length * 2),
        duration: `${Math.floor(durationSum / 60)}h ${durationSum % 60}m`,
        topics: modTopics.map((t) => {
          const isTopicOwned = isEnrolled || entitledTopicIdSet.has(t._id.toString());
          const topicLessons = lessons
            .filter((l) => l.topicId.toString() === t._id.toString())
            .map((les) => ({
              _id: les._id,
              title: les.title,
              duration: les.duration || 15,
              playbackReference: les.playbackReference || '',
              videoUrl: les.playbackReference || '',
              isLocked: !isTopicOwned && !t.isFree,
              resources: [
                { name: 'Lecture Slides.pdf', type: 'PDF', size: '2.4 MB' },
                { name: 'Starter Code.zip', type: 'ZIP', size: '4.8 MB' },
              ],
            }));

          return {
            _id: t._id,
            title: t.title,
            price: t.price ?? 0,
            isFree: t.isFree,
            isOwned: isTopicOwned,
            duration: t.duration || 30,
            videoUrl: topicLessons[0]?.playbackReference || '',
            lessons: topicLessons,
          };
        }),
      };
    });

    const finalPrice = course.coursePrice ?? 0;

    return {
      course: {
        ...course,
        price: finalPrice,
        coursePrice: finalPrice,
        originalPrice: finalPrice > 0 ? Math.round(finalPrice * 2) : 0,
        instructorName: [course.instructorId?.firstName, course.instructorId?.lastName].filter(Boolean).join(' ') || 'Instructor',
        instructorAvatar: course.instructorId?.profilePhoto || null,
        instructorTitle: instructorProfile?.currentOrganization || (instructorProfile?.expertise && instructorProfile.expertise.length > 0 ? instructorProfile.expertise.join(' • ') : '') || `${course.category || 'Technology'} Specialist & Verified Instructor`,
        instructorBio: instructorProfile?.bio || instructorProfile?.experience,
        rating: 4.8,
        reviewCount: '12,450 ratings',
        studentCount: '45,820 students',
        isEnrolled,
        enrolledTopicsCount,
        totalTopicsCount: topics.length,
      },
      isEnrolled,
      enrolledTopicsCount,
      totalTopicsCount: topics.length,
      syllabus,
    };
  }
}
