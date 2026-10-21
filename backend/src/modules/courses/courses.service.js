import mongoose from 'mongoose';
import {
  Course,
  Module,
  Topic,
  Lesson,
  Resource,
  User,
  Review,
  Rating,
  Entitlement,
  InstructorProfile,
  LearningProgress,
  CommunityQuestion,
  Answer,
  Notification,
} from '../../models/index.js';
import { ENTITLEMENT_STATUS, PRODUCT_TYPES } from '../../config/constants.js';
import { cached, keyFrom, CACHE_NS } from '../../utils/cache.js';
import { courseSelect, userSelect, COURSE_ALL_FIELDS } from '../../utils/courseMedia.js';
import { clampLimit, parsePagination, exactRegex, escapeRegex } from '../../utils/query.js';

// Fields read by the course card formatter (featured + catalog). Media fields become URLs.
const COURSE_CARD_FIELDS =
  'title slug instructorId rating reviewCount reviewsCount coursePrice thumbnail category level ' +
  'shortDescription description maxEnrollmentLimit enrolledCount schedule mentorStatus professionalTags ' +
  'experienceMetrics qualifications totalSessions courseIncludes createdAt updatedAt';

// Internal payment/approval bookkeeping never needed by public course pages.
const COURSE_INTERNAL_FIELDS = new Set([
  'cashfreeOrderId', 'cashfreePaymentSessionId', 'cashfreePaymentId', 'instructorEarnings', 'platformFee',
  'rejectionReason', 'publishingFeeAmount', 'publishingFeePaid', 'publishingFeePaidAt', 'approvedBy',
]);
const COURSE_PUBLIC_DETAIL_FIELDS = COURSE_ALL_FIELDS.filter((f) => !COURSE_INTERNAL_FIELDS.has(f));

/** Active enrollment counts keyed by course id (matches either courseId or productId). */
async function enrollmentCountsFor(courseIds) {
  const agg = await Entitlement.aggregate([
    {
      $match: {
        status: ENTITLEMENT_STATUS.ACTIVE,
        $or: [{ productId: { $in: courseIds } }, { courseId: { $in: courseIds } }],
      },
    },
    { $group: { _id: { $ifNull: ['$courseId', '$productId'] }, count: { $sum: 1 } } },
  ]);
  const map = {};
  agg.forEach((item) => {
    if (item._id) map[item._id.toString()] = item.count;
  });
  return map;
}

/** Approved review stats keyed by course id. */
async function reviewStatsFor(courseIds) {
  const agg = await Review.aggregate([
    { $match: { courseId: { $in: courseIds }, status: 'APPROVED' } },
    { $group: { _id: '$courseId', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);
  const map = {};
  agg.forEach((item) => {
    if (item._id) {
      map[item._id.toString()] = {
        avgRating: Math.round(item.avgRating * 10) / 10,
        totalReviews: item.totalReviews,
      };
    }
  });
  return map;
}

/** Set of course ids (strings) the user holds an active entitlement for, among `courseIds`. */
async function enrolledCourseIdsFor(userId, courseIds) {
  const set = new Set();
  if (!userId || !mongoose.isValidObjectId(userId) || courseIds.length === 0) return set;
  const entitlements = await Entitlement.find({
    userId,
    status: ENTITLEMENT_STATUS.ACTIVE,
    $or: [{ productId: { $in: courseIds } }, { courseId: { $in: courseIds } }],
  })
    .select('productId courseId')
    .lean();
  entitlements.forEach((e) => {
    if (e.productId) set.add(e.productId.toString());
    if (e.courseId) set.add(e.courseId.toString());
  });
  return set;
}

/** Per-user overlay on cached (shared, immutable) course cards. */
async function withEnrollmentFlags(cards, userId) {
  if (!userId || cards.length === 0) return cards;
  const enrolled = await enrolledCourseIdsFor(userId, cards.map((c) => new mongoose.Types.ObjectId(c.id)));
  if (enrolled.size === 0) return cards;
  return cards.map((c) => (enrolled.has(c.id) ? { ...c, isEnrolled: true, isOwned: true } : c));
}

export class CoursesService {
  /**
   * 1. Featured Courses for Home Page (Image 4)
   * The user-agnostic list is cached; enrollment flags are applied per request.
   */
  static async getFeaturedCourses(limit = 8, userId = null) {
    const safeLimit = clampLimit(limit, { defaultLimit: 8, maxLimit: 50 });
    const cards = await cached(`${CACHE_NS.CATALOG}:featured:${safeLimit}`, () => this.buildFeaturedCards(safeLimit));
    return withEnrollmentFlags(cards, userId);
  }

  static async buildFeaturedCards(limit) {
    const courses = await Course.find({ status: 'PUBLISHED' })
      .select(courseSelect(COURSE_CARD_FIELDS))
      .populate('instructorId', userSelect('firstName lastName profilePhoto updatedAt'))
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const courseIds = courses.map((c) => c._id);
    const [enrollmentMap, reviewMap] = await Promise.all([
      enrollmentCountsFor(courseIds),
      reviewStatsFor(courseIds),
    ]);

    const badges = ['BEST SELLER', 'POPULAR', 'HOT & NEW', 'TOP RATED'];

    return courses.map((c, idx) => {
      const isEnrolled = false;
      const maxLimit = typeof c.maxEnrollmentLimit === 'number' && c.maxEnrollmentLimit > 0 ? c.maxEnrollmentLimit : null;
      const liveEntitlements = enrollmentMap[c._id.toString()] || 0;
      const enrolled = Math.max(c.enrolledCount || 0, liveEntitlements);
      const isSoldOut = Boolean(maxLimit !== null && enrolled >= maxLimit);
      const remainingSeats = maxLimit !== null ? Math.max(0, maxLimit - enrolled) : null;
      const revData = reviewMap[c._id.toString()];
      const rating = revData ? revData.avgRating : (c.rating || 0);
      const reviewCount = revData ? `${revData.totalReviews}` : (c.reviewCount ? `${c.reviewCount}` : '');

      return {
        id: c._id.toString(),
        _id: c._id.toString(),
        title: c.title,
        slug: c.slug || c._id.toString(),
        instructorName: [c.instructorId?.firstName, c.instructorId?.lastName].filter(Boolean).join(' ') || 'Instructor',
        instructorAvatar: c.instructorId?.profilePhoto || null,
        rating,
        reviewCount,
        reviewsCount: revData ? revData.totalReviews : (c.reviewsCount || 0),
        price: c.coursePrice ?? 0,
        originalPrice: Math.round((c.coursePrice || 1999) * 2.5),
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
        category: (c.category || 'DEVELOPMENT').toUpperCase(),
        level: c.level || 'Beginner',
        badge: badges[idx % badges.length],
        shortDescription: c.shortDescription || c.description,
        isEnrolled,
        isOwned: isEnrolled,
        // Optional Enrollment Cap & Rich Card Attributes
        maxEnrollmentLimit: maxLimit,
        enrolledCount: enrolled,
        isSoldOut,
        remainingSeats,
        schedule: c.schedule || '',
        mentorStatus: c.mentorStatus || '',
        professionalTags: Array.isArray(c.professionalTags) ? c.professionalTags : [],
        experienceMetrics: Array.isArray(c.experienceMetrics) ? c.experienceMetrics : [],
        qualifications: Array.isArray(c.qualifications) ? c.qualifications : [],
        totalSessions: c.totalSessions ?? null,
        durationHours: c.courseIncludes?.videoHours || '20+ Hours',
      };
    });
  }

  /**
   * 2. Catalog & Dynamic Filtering (Image 5)
   */
  static async getCatalog({ category, level, search, sort = 'newest', page = 1, limit = 20 } = {}, userId = null) {
    const pagination = parsePagination({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
    const params = {
      category: typeof category === 'string' ? category : undefined,
      level: typeof level === 'string' ? level : undefined,
      search: typeof search === 'string' ? search.trim().slice(0, 100) : undefined,
      sort: typeof sort === 'string' ? sort : 'newest',
    };

    const [pageData, filters] = await Promise.all([
      cached(`${CACHE_NS.CATALOG}:catalog:${keyFrom({ ...params, page: pagination.page, limit: pagination.limit })}`, () =>
        this.buildCatalogPage(params, pagination)
      ),
      cached(`${CACHE_NS.CATALOG}:catalogFilters`, () => this.buildCatalogFilters()),
    ]);

    return {
      courses: await withEnrollmentFlags(pageData.courses, userId),
      pagination: pageData.pagination,
      filters,
    };
  }

  static async buildCatalogFilters() {
    const allPublished = await Course.find({ status: 'PUBLISHED' }).select('category level').lean();

    // Dynamically calculate category & level counts for sidebar filter (Image 5)
    const categoryCountMap = {};
    const levelCountMap = {};

    allPublished.forEach((c) => {
      if (c.category && c.category.trim()) {
        const cat = c.category.trim();
        categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
      }
      if (c.level && c.level.trim()) {
        const lvl = c.level.trim();
        levelCountMap[lvl] = (levelCountMap[lvl] || 0) + 1;
      }
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

    return { categories: categoriesFilter, levels: levelsFilter };
  }

  static async buildCatalogPage({ category, level, search, sort }, { page, limit, skip }) {
    const query = { status: 'PUBLISHED' };

    if (category && category !== 'All' && category !== 'ALL') {
      query.category = { $regex: exactRegex(category) };
    }

    if (level && level !== 'All' && level !== 'ALL') {
      query.level = { $regex: exactRegex(level) };
    }

    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ title: re }, { shortDescription: re }, { category: re }];
    }

    const sortObj = {};
    if (sort === 'price-low') sortObj.coursePrice = 1;
    else if (sort === 'price-high') sortObj.coursePrice = -1;
    else if (sort === 'rating') sortObj.createdAt = -1;
    else sortObj.createdAt = -1;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .select(courseSelect(COURSE_CARD_FIELDS))
        .populate('instructorId', userSelect('firstName lastName profilePhoto updatedAt'))
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
    ]);

    const courseIds = courses.map((c) => c._id);
    const [enrollmentMap, reviewMap] = await Promise.all([
      enrollmentCountsFor(courseIds),
      reviewStatsFor(courseIds),
    ]);

    const formatted = courses.map((c) => {
      const isEnrolled = false;
      const maxLimit = typeof c.maxEnrollmentLimit === 'number' && c.maxEnrollmentLimit > 0 ? c.maxEnrollmentLimit : null;
      const liveEntitlements = enrollmentMap[c._id.toString()] || 0;
      const enrolled = Math.max(c.enrolledCount || 0, liveEntitlements);
      const isSoldOut = Boolean(maxLimit !== null && enrolled >= maxLimit);
      const remainingSeats = maxLimit !== null ? Math.max(0, maxLimit - enrolled) : null;
      const revData = reviewMap[c._id.toString()];
      const rating = revData ? revData.avgRating : (c.rating || 0);
      const reviewCount = revData ? `${revData.totalReviews}` : (c.reviewCount ? `${c.reviewCount}` : '');

      return {
        id: c._id.toString(),
        _id: c._id.toString(),
        title: c.title,
        slug: c.slug || c._id.toString(),
        instructorName: [c.instructorId?.firstName, c.instructorId?.lastName].filter(Boolean).join(' ') || 'Instructor',
        instructorAvatar: c.instructorId?.profilePhoto || null,
        rating,
        reviewCount,
        reviewsCount: revData ? revData.totalReviews : (c.reviewsCount || 0),
        price: c.coursePrice ?? 0,
        originalPrice: Math.round((c.coursePrice || 1999) * 2.2),
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
        category: (c.category || 'Development').toUpperCase(),
        level: c.level || 'Beginner',
        shortDescription: c.shortDescription || c.description,
        isEnrolled,
        isOwned: isEnrolled,
        // Optional Enrollment Cap & Rich Card Attributes
        maxEnrollmentLimit: maxLimit,
        enrolledCount: enrolled,
        isSoldOut,
        remainingSeats,
        schedule: c.schedule || '',
        mentorStatus: c.mentorStatus || '',
        professionalTags: Array.isArray(c.professionalTags) ? c.professionalTags : [],
        experienceMetrics: Array.isArray(c.experienceMetrics) ? c.experienceMetrics : [],
        qualifications: Array.isArray(c.qualifications) ? c.qualifications : [],
        totalSessions: c.totalSessions ?? null,
        durationHours: c.courseIncludes?.videoHours || '20+ Hours',
      };
    });

    return {
      courses: formatted,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 3. Course Details & Complete Syllabus Hierarchy (Image 5 Syllabus Section)
   */
  /**
   * Shared (user-agnostic) data for the course detail page. Cached; callers must not mutate it.
   * 4 dependent DB stages: course -> modules (+ independent lookups) -> topics -> lessons.
   */
  static async loadCourseDetailBase(slugOrId) {
    let query = { slug: slugOrId.toLowerCase() };
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      query = { $or: [{ slug: slugOrId.toLowerCase() }, { _id: slugOrId }] };
    }

    const course = await Course.findOne(query)
      .select(courseSelect(COURSE_PUBLIC_DETAIL_FIELDS))
      .populate('instructorId', userSelect('firstName lastName email profilePhoto updatedAt'))
      .lean();

    if (!course) return null;

    const [modules, instProfile, activeEntitlementsCount, reviewStats] = await Promise.all([
      Module.find({ courseId: course._id }).sort({ order: 1 }).lean(),
      course.instructorId?._id
        ? InstructorProfile.findOne({ userId: course.instructorId._id })
            .select('headline title expertise bio experience profilePhoto')
            .lean()
        : null,
      Entitlement.countDocuments({
        status: ENTITLEMENT_STATUS.ACTIVE,
        $or: [{ productId: course._id }, { courseId: course._id }],
      }),
      Review.aggregate([
        { $match: { courseId: course._id, status: 'APPROVED' } },
        { $group: { _id: '$courseId', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
      ]),
    ]);

    const moduleIds = modules.map((m) => m._id);
    const topics = await Topic.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({
      topicId: { $in: topics.map((t) => t._id) },
      contentOfferingId: { $in: [null, undefined] },
    }).sort({ order: 1 }).lean();

    return { course, modules, topics, lessons, instProfile, activeEntitlementsCount, reviewStats };
  }

  static async getCourseDetails(slugOrId, userId = null) {
    if (typeof slugOrId !== 'string' || !slugOrId.trim()) return null;

    const base = await cached(`${CACHE_NS.CATALOG}:courseDetail:${slugOrId.toLowerCase()}`, () =>
      this.loadCourseDetailBase(slugOrId)
    );
    if (!base) return null;

    const { course, modules, topics, lessons, instProfile, activeEntitlementsCount, reviewStats } = base;
    const topicIds = topics.map((t) => t._id);

    // Per-user lookups (never cached), run concurrently.
    const hasUser = Boolean(userId && (mongoose.isValidObjectId(userId) || typeof userId === 'string'));
    const userObjId = hasUser && mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const userQueries = [{ userId: String(userId) }];
    if (userObjId) userQueries.push({ userId: userObjId });

    const [activeEntitlements, progressDocs] = await Promise.all([
      hasUser
        ? Entitlement.find({
            $and: [
              { $or: userQueries },
              {
                $or: [
                  { productId: course._id },
                  { courseId: course._id },
                  { productId: course._id.toString() },
                  { courseId: course._id.toString() },
                  { productId: { $in: topicIds } },
                  { topicId: { $in: topicIds } },
                ],
              },
            ],
            status: { $in: [ENTITLEMENT_STATUS.ACTIVE, 'ACTIVE'] },
          }).lean()
        : [],
      userId
        ? LearningProgress.find({ $or: userQueries, courseId: course._id, completed: true })
            .select('lessonId')
            .lean()
        : [],
    ]);

    // Deduplicate modules by title
    const uniqueModules = [];
    const seenModTitles = new Set();
    for (const mod of modules) {
      const normModTitle = (mod.title || '').trim().toLowerCase();
      if (!seenModTitles.has(normModTitle)) {
        seenModTitles.add(normModTitle);
        uniqueModules.push(mod);
      }
    }

    // Check user active entitlements if authenticated
    let isEnrolled = false;
    let enrolledTopicsCount = 0;
    const entitledTopicIdSet = new Set();

    if (hasUser) {
      for (const ent of activeEntitlements) {
        const matchesCourse =
          ent.courseId?.toString() === course._id.toString() ||
          ent.productId?.toString() === course._id.toString();

        if (
          (ent.productType === PRODUCT_TYPES.COURSE || ent.productType === 'COURSE') &&
          matchesCourse
        ) {
          isEnrolled = true;
        } else if (matchesCourse && !ent.topicId) {
          isEnrolled = true;
        }

        if (ent.topicId) {
          entitledTopicIdSet.add(ent.topicId.toString());
        }
        if (ent.productId && topicIds.some((tId) => tId.toString() === ent.productId.toString())) {
          entitledTopicIdSet.add(ent.productId.toString());
        }
      }

      if (topics.length > 0 && entitledTopicIdSet.size >= topics.length) {
        isEnrolled = true;
      }

      enrolledTopicsCount = isEnrolled ? topics.length : entitledTopicIdSet.size;
    }

    const syllabus = uniqueModules.map((mod) => {
      const modTopicsRaw = topics.filter((t) => t.moduleId.toString() === mod._id.toString());
      
      // Deduplicate topics within module
      const modTopics = [];
      const seenTopTitles = new Set();
      for (const top of modTopicsRaw) {
        const normTopTitle = (top.title || '').trim().toLowerCase();
        if (!seenTopTitles.has(normTopTitle)) {
          seenTopTitles.add(normTopTitle);
          modTopics.push(top);
        }
      }

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
          const rawTopicLessons = lessons.filter((l) => l.topicId.toString() === t._id.toString());
          
          // Deduplicate lessons within topic by title
          const topicLessons = [];
          const seenLesTitles = new Set();
          for (const les of rawTopicLessons) {
            const normLesTitle = (les.title || '').trim().toLowerCase();
            if (!seenLesTitles.has(normLesTitle)) {
              seenLesTitles.add(normLesTitle);
              topicLessons.push({
                _id: les._id,
                title: les.title,
                duration: les.duration || 15,
                playbackReference: les.playbackReference || '',
                videoUrl: les.playbackReference || '',
                isLocked: !isTopicOwned && !t.isFree,
                resources: Array.isArray(les.resources) && les.resources.length > 0 ? les.resources : [],
              });
            }
          }

          if (topicLessons.length === 0) {
            topicLessons.push({
              _id: t._id,
              title: t.title,
              duration: t.duration || 30,
              playbackReference: t.videoUrl || '',
              videoUrl: t.videoUrl || '',
              isLocked: !isTopicOwned && !t.isFree,
              resources: Array.isArray(t.resources) && t.resources.length > 0 ? t.resources : [],
            });
          }

          return {
            _id: t._id,
            title: t.title,
            description: t.description || '',
            price: t.price ?? 0,
            isFree: t.isFree,
            isOwned: isTopicOwned,
            duration: t.duration || 30,
            videoUrl: topicLessons[0]?.playbackReference || t.videoUrl || '',
            lessons: topicLessons,
          };
        }),
      };
    });

    const finalPrice = course.coursePrice ?? 0;

    const instructorName = [course.instructorId?.firstName, course.instructorId?.lastName].filter(Boolean).join(' ') || 'Instructor';
    const instructorAvatar = course.instructorId?.profilePhoto || instProfile?.profilePhoto || null;
    const instructorHeadline = instProfile?.headline || instProfile?.title || (instProfile?.expertise?.length > 0 ? instProfile.expertise.join(' • ') : '') || course.instructorId?.headline || 'Senior Technology Lead & Certified Cloud Architect';
    const instructorBio = instProfile?.bio || instProfile?.experience || course.instructorId?.bio || 'Passionate engineering educator and technical architect with industry experience in cloud systems, production microservices, and modern development workflows.';
    const instructorExperience = instProfile?.experience || '8+ Years';

    const maxLimit = typeof course.maxEnrollmentLimit === 'number' && course.maxEnrollmentLimit > 0 ? course.maxEnrollmentLimit : null;
    const enrolled = Math.max(course.enrolledCount || 0, activeEntitlementsCount);
    const isSoldOut = Boolean(maxLimit !== null && enrolled >= maxLimit);
    const remainingSeats = maxLimit !== null ? Math.max(0, maxLimit - enrolled) : null;

    const realRating = reviewStats[0]?.avgRating ? Math.round(reviewStats[0].avgRating * 10) / 10 : (course.rating || 0);
    const realReviewCount = reviewStats[0]?.totalReviews || course.reviewsCount || 0;

    const completedLessonIds = progressDocs.map((p) => p.lessonId?.toString()).filter(Boolean);

    return {
      course: {
        ...course,
        price: finalPrice,
        coursePrice: finalPrice,
        instructorName,
        instructorAvatar,
        instructorHeadline,
        instructorTitle: instructorHeadline,
        instructorBio,
        instructorExperience,
        rating: realRating,
        reviewCount: realReviewCount > 0 ? `${realReviewCount}` : '',
        reviewsCount: realReviewCount,
        studentCount: `${enrolled} students`,
        isEnrolled,
        enrolledTopicsCount,
        totalTopicsCount: topics.length,
        maxEnrollmentLimit: maxLimit,
        enrolledCount: enrolled,
        isSoldOut,
        remainingSeats,
        schedule: course.schedule || '',
        mentorStatus: course.mentorStatus || '',
        professionalTags: Array.isArray(course.professionalTags) ? course.professionalTags : [],
        experienceMetrics: Array.isArray(course.experienceMetrics) ? course.experienceMetrics : [],
        qualifications: Array.isArray(course.qualifications) ? course.qualifications : [],
        totalSessions: course.totalSessions ?? null,
      },
      isEnrolled,
      enrolledTopicsCount,
      totalTopicsCount: topics.length,
      completedLessonIds,
      syllabus,
    };
  }

  /**
   * 4. Dynamic Topics for Standalone Topic Purchases (Image 4)
   */
  static async getAllTopics({ courseId, category, search, limit } = {}) {
    const params = {
      courseId: typeof courseId === 'string' ? courseId : undefined,
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? search.trim().slice(0, 100) : undefined,
    };
    const topics = await cached(`${CACHE_NS.CATALOG}:allTopics:${keyFrom(params)}`, () => this.buildAllTopics(params));
    // Historically unbounded; an explicit limit is honoured and a hard cap protects the endpoint.
    const safeLimit = clampLimit(limit, { defaultLimit: 500, maxLimit: 500 });
    return topics.length > safeLimit ? topics.slice(0, safeLimit) : topics;
  }

  static async buildAllTopics({ courseId, category, search }) {
    const TOPIC_COURSE_FIELDS = 'title category thumbnail coursePrice slug status instructorId';
    let moduleIds = [];
    if (courseId) {
      let query = { courseId };
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        query = { courseId: new mongoose.Types.ObjectId(courseId) };
      }
      const modules = await Module.find(query).select('_id').lean();
      moduleIds = modules.map((m) => m._id);
    }

    const topicQuery = { status: { $ne: 'ARCHIVED' } };
    if (moduleIds.length > 0) {
      topicQuery.moduleId = { $in: moduleIds };
    }
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      topicQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { skills: searchRegex },
        { prerequisites: searchRegex },
        { learningObjectives: searchRegex },
      ];
    }

    const topics = await Topic.find(topicQuery)
      .populate({
        path: 'courseId',
        select: courseSelect(TOPIC_COURSE_FIELDS),
        populate: {
          path: 'instructorId',
          select: userSelect('firstName lastName email profilePhoto updatedAt'),
        },
      })
      .populate({
        path: 'moduleId',
        select: 'title order courseId',
        populate: {
          path: 'courseId',
          select: courseSelect(TOPIC_COURSE_FIELDS),
          populate: {
            path: 'instructorId',
            select: userSelect('firstName lastName email profilePhoto updatedAt'),
          },
        },
      })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const topicIds = topics.map((t) => t._id);
    const lessons = await Lesson.find({ topicId: { $in: topicIds } })
      .select('title duration playbackReference videoUrl isFreePreview order topicId')
      .sort({ order: 1 })
      .lean();

    const lessonsByTopic = new Map();
    for (const l of lessons) {
      const key = l.topicId?.toString();
      if (!lessonsByTopic.has(key)) lessonsByTopic.set(key, []);
      lessonsByTopic.get(key).push(l);
    }

    let formatted = topics.map((t) => {
      const mod = t.moduleId;
      const crs = t.courseId || mod?.courseId;
      const inst = crs?.instructorId;
      const instructorName = inst
        ? `${inst.firstName || ''} ${inst.lastName || ''}`.trim() || inst.email || 'Course Instructor'
        : 'Course Instructor';

      const topLessons = lessonsByTopic.get(t._id.toString()) || [];
      const hasVideo = !!(t.videoUrl || topLessons.some((l) => l.playbackReference || l.videoUrl || l.videoId));

      return {
        id: t._id.toString(),
        _id: t._id.toString(),
        title: t.title,
        description: t.description || '',
        price: t.price ?? 0,
        currency: t.currency || 'INR',
        duration: t.duration || 30,
        difficulty: t.difficulty || 'ALL_LEVELS',
        skills: Array.isArray(t.skills) ? t.skills : [],
        prerequisites: Array.isArray(t.prerequisites) ? t.prerequisites : [],
        learningObjectives: Array.isArray(t.learningObjectives) ? t.learningObjectives : [],
        isFree: !!t.isFree,
        category: (crs?.category || 'Development').toUpperCase(),
        courseTitle: crs?.title || 'Comprehensive Course',
        courseSlug: crs?.slug || '',
        courseId: crs?._id?.toString() || '',
        moduleTitle: mod?.title || '',
        instructor: {
          name: instructorName,
          email: inst?.email || '',
          avatar: inst?.profilePhoto || null,
        },
        lessonsCount: topLessons.length || (t.lessons?.length || 1),
        lessons: topLessons.map((l) => ({
          id: l._id.toString(),
          title: l.title,
          duration: l.duration || 15,
          isFreePreview: !!l.isFreePreview,
        })),
        videoUrl: t.videoUrl || topLessons[0]?.playbackReference || topLessons[0]?.videoUrl || '',
        hasVideo,
        thumbnail: crs?.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80',
      };
    });

    if (category && category !== 'All' && category !== 'ALL') {
      formatted = formatted.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }

    return formatted;
  }

  /**
   * 5. Real-Time Student Course Progress Synchronization
   */
  static async updateProgress({ slug, userId, lessonId, topicId, completed }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title slug instructorId rating reviewCount');
    if (!course) {
      throw new Error('Course not found');
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = course._id;
    let lessonObjId = mongoose.isValidObjectId(lessonId) ? new mongoose.Types.ObjectId(lessonId) : null;
    let topicObjId = mongoose.isValidObjectId(topicId) ? new mongoose.Types.ObjectId(topicId) : null;

    if (!lessonObjId && lessonId) {
      const foundLesson = await Lesson.findOne({ $or: [{ _id: lessonId }, { title: lessonId }] }).lean();
      if (foundLesson) {
        lessonObjId = foundLesson._id;
        topicObjId = foundLesson.topicId;
      }
    }

    const progFilter = {
      userId: userObjId,
      courseId: courseObjId,
    };
    if (lessonObjId) progFilter.lessonId = lessonObjId;
    else if (topicObjId) progFilter.topicId = topicObjId;

    if (completed) {
      await LearningProgress.findOneAndUpdate(
        progFilter,
        {
          $set: {
            userId: userObjId,
            courseId: courseObjId,
            lessonId: lessonObjId,
            topicId: topicObjId,
            completed: true,
            lastWatchedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    } else {
      await LearningProgress.deleteOne(progFilter);
    }

    // Fetch all completed records for this course
    const allCompletedRecords = await LearningProgress.find({
      userId: userObjId,
      courseId: courseObjId,
      completed: true,
    }).lean();

    const courseTopics = await Topic.find({ courseId: courseObjId }).select('_id').lean();
    const topicIds = courseTopics.map((t) => t._id);
    const totalLessons = (await Lesson.countDocuments({ topicId: { $in: topicIds } })) || courseTopics.length || 1;

    const completedCount = allCompletedRecords.length;
    const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

    await LearningProgress.updateMany(
      { userId: userObjId, courseId: courseObjId },
      { $set: { progressPercent } }
    );

    return {
      progressPercent,
      completedCount,
      totalLessons,
      completedLessonIds: allCompletedRecords.map((r) => r.lessonId?.toString()).filter(Boolean),
    };
  }

  /**
   * 6. Course Reviews & Ratings System
   */
  static async getMyReview({ slug, userId }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title slug instructorId rating reviewCount').lean();
    if (!course) return null;

    const userObjId = new mongoose.Types.ObjectId(userId);
    const review = await Review.findOne({
      courseId: course._id,
      userId: userObjId,
    }).lean();

    // Check enrollment eligibility
    const entitlement = await Entitlement.findOne({
      userId: userObjId,
      $or: [{ courseId: course._id }, { productId: course._id }],
      status: { $in: [ENTITLEMENT_STATUS.ACTIVE, 'ACTIVE'] },
    }).lean();

    const hasProgress = await LearningProgress.exists({
      userId: userObjId,
      courseId: course._id,
    });

    const isEligible = Boolean(entitlement || hasProgress);

    return {
      review,
      isEligible,
    };
  }

  static async submitReview({ slug, userId, rating, comment, title }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title slug instructorId rating reviewCount');
    if (!course) {
      throw new Error('Course not found');
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Verify eligibility: Must have active entitlement or progress
    const entitlement = await Entitlement.findOne({
      userId: userObjId,
      $or: [{ courseId: course._id }, { productId: course._id }],
      status: { $in: [ENTITLEMENT_STATUS.ACTIVE, 'ACTIVE'] },
    }).lean();

    const hasProgress = await LearningProgress.exists({
      userId: userObjId,
      courseId: course._id,
    });

    if (!entitlement && !hasProgress) {
      throw new Error('Eligibility requirement: Only students enrolled in or attending this course can submit a review.');
    }

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));

    const review = await Review.findOneAndUpdate(
      { courseId: course._id, userId: userObjId },
      {
        $set: {
          instructorId: course.instructorId || null,
          rating: numRating,
          comment: (comment || '').trim() || 'Great course!',
          title: (title || '').trim(),
          isVerifiedPurchase: true,
          reviewType: 'COURSE',
          status: 'PUBLISHED',
        },
      },
      { upsert: true, new: true }
    );

    await Rating.findOneAndUpdate(
      { courseId: course._id, userId: userObjId },
      { $set: { rating: numRating } },
      { upsert: true }
    );

    const allReviews = await Review.find({ courseId: course._id, status: 'PUBLISHED' }).lean();
    const avgRating = allReviews.length > 0
      ? Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
      : numRating;

    course.rating = avgRating;
    course.reviewCount = allReviews.length;
    await course.save();

    return {
      review,
      avgRating,
      reviewCount: allReviews.length,
    };
  }

  static async getCourseReviews({ slug, rating, page = 1, limit = 10 }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title rating reviewCount').lean();
    if (!course) return { reviews: [], metrics: { avgRating: 0, totalReviews: 0, breakdown: {} } };

    const filter = { courseId: course._id, status: 'PUBLISHED' };
    if (rating && !isNaN(Number(rating))) {
      filter.rating = Number(rating);
    }

    const allPublished = await Review.find({ courseId: course._id, status: 'PUBLISHED' }).lean();
    const totalReviews = allPublished.length;
    const avgRating = totalReviews > 0
      ? Number((allPublished.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1))
      : 0;

    const breakdown = {
      5: allPublished.filter((r) => r.rating === 5).length,
      4: allPublished.filter((r) => r.rating === 4).length,
      3: allPublished.filter((r) => r.rating === 3).length,
      2: allPublished.filter((r) => r.rating === 2).length,
      1: allPublished.filter((r) => r.rating === 1).length,
    };

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const formatted = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      title: r.title || '',
      comment: r.comment,
      createdAt: r.createdAt,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulVotesCount: r.helpfulVotes?.length || 0,
      studentName: [r.userId?.firstName, r.userId?.lastName].filter(Boolean).join(' ') || 'Student',
      studentAvatar: r.userId?.profilePhoto || null,
    }));

    return {
      reviews: formatted,
      metrics: {
        avgRating,
        totalReviews,
        breakdown,
      },
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit, 10)) || 1,
      },
    };
  }

  static async voteHelpfulReview({ userId, reviewId }) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const existingIndex = review.helpfulVotes.findIndex((id) => id.toString() === userId.toString());

    if (existingIndex > -1) {
      review.helpfulVotes.splice(existingIndex, 1);
    } else {
      review.helpfulVotes.push(userObjId);
    }

    await review.save();
    return { helpfulVotesCount: review.helpfulVotes.length, hasVoted: existingIndex === -1 };
  }

  static async flagReview({ userId, reviewId, reason = '' }) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found');

    review.status = 'FLAGGED';
    review.flaggedReason = reason.trim() || 'Flagged by user for moderation';
    await review.save();

    return { message: 'Review reported for moderation. Thank you.' };
  }

  /**
   * 7. Dedicated Q&A Section with Two-Way Notifications
   */
  static async getQuestions({ slug }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title slug instructorId rating reviewCount').lean();
    if (!course) return [];

    const questions = await CommunityQuestion.find({ courseId: course._id })
      .populate('userId', 'firstName lastName profilePhoto role')
      .sort({ createdAt: -1 })
      .lean();

    const qIds = questions.map((q) => q._id);
    const answers = await Answer.find({ questionId: { $in: qIds } })
      .populate('userId', 'firstName lastName profilePhoto role')
      .sort({ createdAt: 1 })
      .lean();

    return questions.map((q) => ({
      _id: q._id.toString(),
      question: q.question,
      createdAt: q.createdAt,
      status: q.status,
      user: {
        name: [q.userId?.firstName, q.userId?.lastName].filter(Boolean).join(' ') || 'Student',
        avatar: q.userId?.profilePhoto || null,
        role: q.userId?.role || 'STUDENT',
      },
      answers: answers
        .filter((a) => a.questionId.toString() === q._id.toString())
        .map((a) => ({
          _id: a._id.toString(),
          answer: a.answer,
          createdAt: a.createdAt,
          isAccepted: a.isAccepted,
          user: {
            name: [a.userId?.firstName, a.userId?.lastName].filter(Boolean).join(' ') || 'Instructor',
            avatar: a.userId?.profilePhoto || null,
            role: a.userId?.role || 'INSTRUCTOR',
          },
        })),
    }));
  }

  static async askQuestion({ slug, userId, question, lessonId, topicId }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title slug instructorId rating reviewCount');
    if (!course) throw new Error('Course not found');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const newQ = await CommunityQuestion.create({
      userId: userObjId,
      courseId: course._id,
      topicId: mongoose.isValidObjectId(topicId) ? topicId : null,
      lessonId: mongoose.isValidObjectId(lessonId) ? lessonId : null,
      question: question.trim(),
      status: 'OPEN',
    });

    const student = await User.findById(userId).lean();
    const studentName = [student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'A student';

    // Trigger in-app notification to the instructor
    if (course.instructorId) {
      await Notification.create({
        notificationId: `notif_q_${newQ._id}_${Date.now()}`,
        userId: course.instructorId,
        type: 'COURSE_QUESTION',
        title: `New Question in "${course.title}"`,
        message: `${studentName} asked: "${question.trim().slice(0, 100)}${question.trim().length > 100 ? '...' : ''}"`,
        entityType: 'COURSE',
        entityId: course._id,
        isRead: false,
        createdAt: new Date(),
      }).catch((e) => console.warn('Failed to dispatch question notification:', e.message));
    }

    return newQ;
  }

  static async answerQuestion({ slug, userId, questionId, answer }) {
    let query = { slug };
    if (mongoose.isValidObjectId(slug)) {
      query = { $or: [{ slug }, { _id: new mongoose.Types.ObjectId(slug) }] };
    }
    const course = await Course.findOne(query).select('_id title slug instructorId rating reviewCount');
    if (!course) throw new Error('Course not found');

    const question = await CommunityQuestion.findById(questionId);
    if (!question) throw new Error('Question not found');

    const userObjId = new mongoose.Types.ObjectId(userId);
    const newAns = await Answer.create({
      questionId: question._id,
      userId: userObjId,
      answer: answer.trim(),
    });

    question.status = 'ANSWERED';
    await question.save();

    const responder = await User.findById(userId).lean();
    const responderName = [responder?.firstName, responder?.lastName].filter(Boolean).join(' ') || 'Instructor';

    // Trigger notification back to the student who asked
    if (question.userId && question.userId.toString() !== userId.toString()) {
      await Notification.create({
        notificationId: `notif_ans_${newAns._id}_${Date.now()}`,
        userId: question.userId,
        type: 'QUESTION_ANSWERED',
        title: `Your question in "${course.title}" was answered!`,
        message: `${responderName} replied: "${answer.trim().slice(0, 100)}${answer.trim().length > 100 ? '...' : ''}"`,
        entityType: 'COURSE',
        entityId: course._id,
        isRead: false,
        createdAt: new Date(),
      }).catch((e) => console.warn('Failed to dispatch answer notification:', e.message));
    }

    return newAns;
  }
}
