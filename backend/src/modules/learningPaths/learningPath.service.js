import mongoose from 'mongoose';
import {
  LearningPath,
  LearningPathDomain,
  LearningPathDomainTopic,
  Topic,
  TopicContentOffering,
  Lesson,
  Course,
  Module,
  User,
  InstructorProfile,
  Entitlement,
  Order,
  OrderItem,
  Payment,
  Refund,
  InstructorEarning,
  FinancialLedger,
  LearningProgress,
  VideoProgress,
  Review,
} from '../../models/index.js';
import { PRODUCT_TYPES, ENTITLEMENT_STATUS, ORDER_STATUS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../../config/constants.js';

export class LearningPathService {
  /**
   * 1. GET /api/v1/learning-paths
   * List all published learning paths with dynamic domain and topic counts from MongoDB
   */
  static async getLearningPaths({ search, level, limit = 20, page = 1, userId = null } = {}) {
    const filter = {
      status: { $in: ['PUBLISHED', 'ACTIVE', 'Active', 'published'] },
    };

    if (search && search.trim()) {
      filter.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
        { career: new RegExp(search.trim(), 'i') },
      ];
    }

    if (level && level !== 'ALL_LEVELS') {
      filter.level = level;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [paths, total] = await Promise.all([
      LearningPath.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LearningPath.countDocuments(filter),
    ]);

    const pathIds = paths.map((p) => p._id);

    // Aggregate real domain counts and topic counts from DB
    const [domainsAgg, domainTopicsAgg, userPathEntitlements] = await Promise.all([
      LearningPathDomain.aggregate([
        { $match: { learningPathId: { $in: pathIds }, status: 'PUBLISHED' } },
        { $group: { _id: '$learningPathId', count: { $sum: 1 } } },
      ]),
      LearningPathDomainTopic.aggregate([
        { $match: { learningPathId: { $in: pathIds }, status: 'ACTIVE' } },
        { $group: { _id: '$learningPathId', count: { $sum: 1 } } },
      ]),
      userId && mongoose.isValidObjectId(userId)
        ? Entitlement.find({
            userId,
            productType: PRODUCT_TYPES.LEARNING_PATH,
            productId: { $in: pathIds },
            status: ENTITLEMENT_STATUS.ACTIVE,
          }).lean()
        : [],
    ]);

    const enrolledPathIds = new Set(
      (userPathEntitlements || []).map((e) => e.productId?.toString() || e.learningPathId?.toString())
    );

    const formatted = paths.map((p) => {
      const pId = p._id.toString();
      const domainCount = domainsAgg.find((d) => d._id.toString() === pId)?.count || 0;
      const topicCount = domainTopicsAgg.find((t) => t._id.toString() === pId)?.count || 0;

      return {
        id: pId,
        learningPathId: p.learningPathId || pId,
        title: p.title || '',
        slug: p.slug || pId,
        description: p.description || '',
        skills: Array.isArray(p.skills) ? p.skills : [],
        career: p.career || null,
        level: p.level || 'ALL_LEVELS',
        estimatedDuration: p.estimatedDuration || null,
        domainsCount: domainCount,
        topicsCount: topicCount,
        thumbnail: p.thumbnail || null,
        status: p.status,
        isEnrolled: enrolledPathIds.has(pId),
        createdAt: p.createdAt,
      };
    });

    return {
      learningPaths: formatted,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * 2. GET /api/v1/learning-paths/:slugOrId
   * Load complete dynamic roadmap: Learning Path -> Domains -> Topics -> Tutor Offerings info
   */
  static async getLearningPathBySlug(slugOrId, userId = null) {
    let path = null;
    if (mongoose.isValidObjectId(slugOrId)) {
      path = await LearningPath.findOne({
        _id: slugOrId,
        status: { $in: ['PUBLISHED', 'ACTIVE', 'Active', 'published'] },
      }).lean();
    }
    if (!path) {
      path = await LearningPath.findOne({
        slug: slugOrId.toLowerCase(),
        status: { $in: ['PUBLISHED', 'ACTIVE', 'Active', 'published'] },
      }).lean();
    }

    if (!path) return null;

    const pathId = path._id;

    // Fetch published domains ordered by DB order
    const domains = await LearningPathDomain.find({
      learningPathId: pathId,
      status: 'PUBLISHED',
    })
      .sort({ order: 1 })
      .lean();

    const domainIds = domains.map((d) => d._id);

    // Fetch domain-topic relationships
    const domainTopics = await LearningPathDomainTopic.find({
      domainId: { $in: domainIds },
      status: 'ACTIVE',
    })
      .sort({ order: 1 })
      .lean();

    const topicIds = domainTopics.map((dt) => dt.topicId);

    // Fetch canonical topics
    const topics = await Topic.find({ _id: { $in: topicIds } })
      .populate('courseId', 'title slug thumbnail category')
      .populate('moduleId', 'title order')
      .lean();

    // Fetch published tutor offerings for these topics to compute real marketplace stats
    const offerings = await TopicContentOffering.find({
      topicId: { $in: topicIds },
      status: 'PUBLISHED',
    })
      .select('topicId price currency duration durationMinutes instructorId')
      .lean();

    // If student is authenticated, fetch their active offering entitlements, path entitlement, and progress
    let userEntitlements = [];
    let userProgressRecords = [];
    let isPathEnrolled = false;
    if (userId && mongoose.isValidObjectId(userId)) {
      const [offeringsEnts, pathEnt, progressDocs] = await Promise.all([
        Entitlement.find({
          userId,
          productType: PRODUCT_TYPES.CONTENT_OFFERING,
          status: ENTITLEMENT_STATUS.ACTIVE,
        }).lean(),
        Entitlement.findOne({
          userId,
          productType: PRODUCT_TYPES.LEARNING_PATH,
          productId: pathId,
          status: ENTITLEMENT_STATUS.ACTIVE,
        }).lean(),
        LearningProgress.find({ userId }).lean(),
      ]);
      userEntitlements = offeringsEnts;
      isPathEnrolled = Boolean(pathEnt);
      userProgressRecords = progressDocs;
    }

    const ownedOfferingIds = new Set(
      userEntitlements.map((e) => e.productId?.toString() || e.contentOfferingId?.toString())
    );

    let totalPathTopics = 0;
    let completedPathTopics = 0;

    const structuredDomains = domains.map((d) => {
      const dId = d._id.toString();
      const currentDomainTopics = domainTopics.filter((dt) => dt.domainId.toString() === dId);

      let domainTopicsCount = 0;
      let domainCompletedTopicsCount = 0;

      const formattedTopics = currentDomainTopics
        .map((dt) => {
          const topicDoc = topics.find((t) => t._id.toString() === dt.topicId.toString());
          if (!topicDoc) return null;

          domainTopicsCount += 1;
          totalPathTopics += 1;

          const topicOfferings = offerings.filter(
            (o) => o.topicId.toString() === topicDoc._id.toString()
          );

          const prices = topicOfferings.map((o) => o.price).filter((p) => typeof p === 'number');
          const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
          const currency = topicOfferings[0]?.currency || 'INR';

          // Determine student ownership and completion for this topic
          const topicOwnedOfferings = topicOfferings.filter((o) =>
            ownedOfferingIds.has(o._id.toString())
          );
          const isPurchased = topicOwnedOfferings.length > 0;

          let isCompleted = false;
          let progressPercent = 0;

          if (isPurchased && userProgressRecords.length > 0) {
            const ownedOfferingId = topicOwnedOfferings[0]._id.toString();
            const offeringProgress = userProgressRecords.filter(
              (p) => p.contentOfferingId?.toString() === ownedOfferingId
            );
            if (offeringProgress.length > 0) {
              const completedLessons = offeringProgress.filter((p) => p.completed).length;
              progressPercent = Math.round((completedLessons / offeringProgress.length) * 100);
              if (completedLessons === offeringProgress.length && completedLessons > 0) {
                isCompleted = true;
              }
            }
          }

          if (isCompleted) {
            domainCompletedTopicsCount += 1;
            completedPathTopics += 1;
          }

          return {
            id: topicDoc._id.toString(),
            topicId: topicDoc.topicId || topicDoc._id.toString(),
            title: topicDoc.title,
            slug: topicDoc.slug || topicDoc._id.toString(),
            description: topicDoc.description || '',
            difficulty: topicDoc.difficulty || 'BEGINNER',
            duration: topicDoc.duration || 0,
            skills: Array.isArray(topicDoc.skills) ? topicDoc.skills : [],
            order: dt.order,
            isRequired: dt.isRequired,
            isRecommended: dt.isRecommended,
            tutorsCount: topicOfferings.length,
            startingPrice: lowestPrice,
            currency: currency,
            parentCourse: topicDoc.courseId
              ? {
                  id: topicDoc.courseId._id.toString(),
                  title: topicDoc.courseId.title,
                  slug: topicDoc.courseId.slug,
                }
              : null,
            userStatus: {
              isPurchased,
              isCompleted,
              progressPercent,
            },
          };
        })
        .filter(Boolean);

      const domainProgress =
        domainTopicsCount > 0
          ? Math.round((domainCompletedTopicsCount / domainTopicsCount) * 100)
          : 0;

      return {
        id: dId,
        domainId: d.domainId || dId,
        title: d.title,
        slug: d.slug || dId,
        description: d.description || '',
        skills: Array.isArray(d.skills) ? d.skills : [],
        order: d.order,
        topicsCount: domainTopicsCount,
        progress: domainProgress,
        topics: formattedTopics,
      };
    });

    const overallProgress =
      totalPathTopics > 0 ? Math.round((completedPathTopics / totalPathTopics) * 100) : 0;

    return {
      id: pathId.toString(),
      learningPathId: path.learningPathId || pathId.toString(),
      title: path.title,
      slug: path.slug || pathId.toString(),
      description: path.description || '',
      skills: Array.isArray(path.skills) ? path.skills : [],
      career: path.career || null,
      level: path.level || 'ALL_LEVELS',
      estimatedDuration: path.estimatedDuration || null,
      totalDomains: domains.length,
      totalTopics: totalPathTopics,
      overallProgress: overallProgress,
      isEnrolled: isPathEnrolled,
      domains: structuredDomains,
    };
  }

  /**
   * Enroll authenticated student in a Learning Path
   */
  static async enrollLearningPath({ slugOrId, userId }) {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('UNAUTHORIZED: Valid authenticated user required for enrollment');
    }

    let path = null;
    if (mongoose.isValidObjectId(slugOrId)) {
      path = await LearningPath.findById(slugOrId);
    }
    if (!path) {
      path = await LearningPath.findOne({ slug: slugOrId.toLowerCase() });
    }

    if (!path) {
      throw new Error('NOT_FOUND: Learning path not found');
    }

    // Check if user already owns active entitlement for this learning path
    const existingEntitlement = await Entitlement.findOne({
      userId,
      productType: PRODUCT_TYPES.LEARNING_PATH,
      productId: path._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    if (existingEntitlement) {
      return {
        alreadyEnrolled: true,
        pathId: path._id.toString(),
        message: 'You are already enrolled in this learning path.',
      };
    }

    // Create active entitlement
    const entitlement = await Entitlement.create({
      userId,
      productType: PRODUCT_TYPES.LEARNING_PATH,
      productId: path._id,
      learningPathId: path._id,
      source: 'ENROLLMENT',
      status: ENTITLEMENT_STATUS.ACTIVE,
      grantedAt: new Date(),
    });

    return {
      success: true,
      alreadyEnrolled: false,
      pathId: path._id.toString(),
      entitlementId: entitlement._id.toString(),
      message: `Successfully enrolled in ${path.title}!`,
    };
  }

  /**
   * 3. GET /api/v1/topics/:topicId
   * Canonical topic subject view + List of all published Tutor Content Offerings (Marketplace)
   */
  static async getTopicDetail(topicIdOrSlug, userId = null) {
    let topic = null;
    if (mongoose.isValidObjectId(topicIdOrSlug)) {
      topic = await Topic.findById(topicIdOrSlug)
        .populate('courseId', 'title slug description thumbnail category instructorId')
        .populate('moduleId', 'title order')
        .lean();
    }
    if (!topic) {
      topic = await Topic.findOne({ slug: topicIdOrSlug })
        .populate('courseId', 'title slug description thumbnail category instructorId')
        .populate('moduleId', 'title order')
        .lean();
    }

    if (!topic) return null;

    const topicId = topic._id;

    // Fetch published tutor offerings for this topic
    const offerings = await TopicContentOffering.find({
      topicId: topicId,
      status: 'PUBLISHED',
    })
      .populate({
        path: 'instructorId',
        select: 'firstName lastName profilePhoto email',
      })
      .sort({ price: 1 })
      .lean();

    const instructorUserIds = offerings.map((o) => o.instructorId?._id).filter(Boolean);
    const offeringIds = offerings.map((o) => o._id);

    // Fetch instructor profiles, lessons, reviews, and entitlements in parallel
    const [profiles, lessons, reviewsAgg, userEntitlements] = await Promise.all([
      InstructorProfile.find({ userId: { $in: instructorUserIds } }).lean(),
      Lesson.find({ contentOfferingId: { $in: offeringIds }, status: { $in: ['PUBLISHED', 'ACTIVE', 'Active', 'published', 'DRAFT'] } })
        .select('contentOfferingId duration isFreePreview title order')
        .lean(),
      Review.aggregate([
        { $match: { topicId: topicId, status: 'PUBLISHED' } },
        { $group: { _id: '$userId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      userId && mongoose.isValidObjectId(userId)
        ? Entitlement.find({
            userId,
            productType: PRODUCT_TYPES.CONTENT_OFFERING,
            productId: { $in: offeringIds },
            status: ENTITLEMENT_STATUS.ACTIVE,
          }).lean()
        : [],
    ]);

    const ownedOfferingIds = new Set(userEntitlements.map((e) => e.productId.toString()));

    const formattedOfferings = offerings.map((off) => {
      const offId = off._id.toString();
      const instructor = off.instructorId;
      const instUserId = instructor?._id?.toString();
      const profile = profiles.find((p) => p.userId?.toString() === instUserId);

      const offLessons = lessons.filter((l) => l.contentOfferingId?.toString() === offId);
      const totalSeconds = offLessons.reduce((acc, l) => acc + (l.duration || 0), 0);
      const durationDisplay =
        totalSeconds > 0
          ? `${Math.round(totalSeconds / 60)} mins`
          : off.durationMinutes
          ? `${off.durationMinutes} mins`
          : 'Self-paced';

      const isPurchased = ownedOfferingIds.has(offId);

      const instructorName = `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim() || 'Expert Tutor';

      return {
        id: offId,
        offeringId: off.offeringId || offId,
        title: off.title,
        slug: off.slug || offId,
        description: off.description || off.shortDescription || '',
        price: off.price, // AUTHORITATIVE COMMERCIAL PRICE
        currency: off.currency || 'INR',
        duration: durationDisplay,
        totalLessons: offLessons.length,
        skills: Array.isArray(off.skills) ? off.skills : [],
        learningObjectives: Array.isArray(off.learningObjectives) ? off.learningObjectives : [],
        level: off.level || 'ALL_LEVELS',
        thumbnail: off.thumbnail || topic.courseId?.thumbnail || null,
        instructor: {
          id: instUserId || '',
          name: instructorName,
          avatar: instructor?.profilePhoto || null,
          headline: profile?.currentOrganization || profile?.headline || 'Certified Specialist',
          bio: profile?.bio || 'Experienced educator and practitioner.',
        },
        accessState: isPurchased ? 'ACTIVE' : 'NOT_PURCHASED',
        isPurchased: isPurchased,
      };
    });

    return {
      id: topicId.toString(),
      topicId: topic.topicId || topicId.toString(),
      title: topic.title,
      slug: topic.slug || topicId.toString(),
      description: topic.description || '',
      difficulty: topic.difficulty || 'BEGINNER',
      skills: Array.isArray(topic.skills) ? topic.skills : [],
      learningObjectives: Array.isArray(topic.learningObjectives) ? topic.learningObjectives : [],
      prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
      course: topic.courseId
        ? {
            id: topic.courseId._id.toString(),
            title: topic.courseId.title,
            slug: topic.courseId.slug,
            category: topic.courseId.category,
          }
        : null,
      module: topic.moduleId
        ? {
            id: topic.moduleId._id.toString(),
            title: topic.moduleId.title,
          }
        : null,
      offeringsCount: formattedOfferings.length,
      offerings: formattedOfferings,
    };
  }

  /**
   * 4. GET /api/v1/offerings/:offeringId
   * Offering detail: curriculum, instructor info, lessons preview, entitlement access state
   */
  static async getOfferingDetail(offeringIdOrSlug, userId = null) {
    let offering = null;
    if (mongoose.isValidObjectId(offeringIdOrSlug)) {
      offering = await TopicContentOffering.findById(offeringIdOrSlug)
        .populate('topicId', 'title slug description difficulty skills')
        .populate('courseId', 'title slug thumbnail category')
        .populate('instructorId', 'firstName lastName profilePhoto email')
        .lean();
    }
    if (!offering) {
      offering = await TopicContentOffering.findOne({ slug: offeringIdOrSlug })
        .populate('topicId', 'title slug description difficulty skills')
        .populate('courseId', 'title slug thumbnail category')
        .populate('instructorId', 'firstName lastName profilePhoto email')
        .lean();
    }

    if (!offering) return null;

    const offeringId = offering._id;
    const instructor = offering.instructorId;

    const [profile, lessons, entitlement, userProgress] = await Promise.all([
      instructor?._id ? InstructorProfile.findOne({ userId: instructor._id }).lean() : null,
      Lesson.find({ contentOfferingId: offeringId })
        .populate('resources')
        .sort({ order: 1 })
        .lean(),
      userId && mongoose.isValidObjectId(userId)
        ? Entitlement.findOne({
            userId,
            productType: PRODUCT_TYPES.CONTENT_OFFERING,
            productId: offeringId,
            status: ENTITLEMENT_STATUS.ACTIVE,
          }).lean()
        : null,
      userId && mongoose.isValidObjectId(userId)
        ? LearningProgress.find({ userId, contentOfferingId: offeringId }).lean()
        : [],
    ]);

    const isEntitled = Boolean(entitlement);
    const instructorName = `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim() || 'Expert Tutor';

    const formattedLessons = lessons.map((l, index) => {
      const lId = l._id.toString();
      const progress = userProgress.find((p) => p.lessonId?.toString() === lId);
      const isFreePreview = Boolean(l.isFreePreview);
      const canAccess = isEntitled || isFreePreview;

      return {
        id: lId,
        lessonId: l.lessonId || lId,
        title: l.title,
        order: l.order || index + 1,
        duration: l.duration || 0,
        durationDisplay: `${Math.round((l.duration || 0) / 60)} mins`,
        isFreePreview: isFreePreview,
        hasAccess: canAccess,
        isCompleted: Boolean(progress?.completed),
        watchedSeconds: progress?.watchedSeconds || 0,
        resourcesCount: Array.isArray(l.resources) ? l.resources.length : 0,
      };
    });

    const totalSeconds = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    const completedCount = formattedLessons.filter((l) => l.isCompleted).length;
    const progressPercent =
      lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

    return {
      id: offeringId.toString(),
      offeringId: offering.offeringId || offeringId.toString(),
      title: offering.title,
      slug: offering.slug || offeringId.toString(),
      description: offering.description || '',
      shortDescription: offering.shortDescription || '',
      price: offering.price, // AUTHORITATIVE PRICE
      currency: offering.currency || 'INR',
      duration: `${Math.round(totalSeconds / 60)} mins`,
      totalLessons: lessons.length,
      level: offering.level || 'ALL_LEVELS',
      skills: Array.isArray(offering.skills) ? offering.skills : [],
      learningObjectives: Array.isArray(offering.learningObjectives) ? offering.learningObjectives : [],
      prerequisites: Array.isArray(offering.prerequisites) ? offering.prerequisites : [],
      topic: offering.topicId
        ? {
            id: offering.topicId._id.toString(),
            title: offering.topicId.title,
            slug: offering.topicId.slug,
          }
        : null,
      instructor: {
        id: instructor?._id?.toString() || '',
        name: instructorName,
        avatar: instructor?.profilePhoto || null,
        title: profile?.currentOrganization || profile?.headline || 'Subject Matter Expert',
        bio: profile?.bio || 'Dedicated educator delivering high-impact practical masterclasses.',
      },
      accessState: isEntitled ? 'ACTIVE' : 'NOT_PURCHASED',
      isEntitled: isEntitled,
      curriculum: formattedLessons,
      progress: {
        completedLessons: completedCount,
        totalLessons: lessons.length,
        progressPercent: progressPercent,
      },
    };
  }

  /**
   * 5. GET /api/v1/offerings/:offeringId/lessons/:lessonId/content
   * Strictly entitlement-gated playback/lesson content authorization
   */
  static async getOfferingLessonContent(offeringId, lessonId, userId) {
    if (!userId) {
      throw new Error('UNAUTHORIZED: Authentication required to access lesson content');
    }

    const [offering, lesson] = await Promise.all([
      TopicContentOffering.findById(offeringId).lean(),
      Lesson.findOne({ _id: lessonId, contentOfferingId: offeringId })
        .populate('videoId')
        .populate('resources')
        .lean(),
    ]);

    if (!offering || !lesson) {
      throw new Error('NOT_FOUND: Offering or lesson not found');
    }

    // Check Entitlement for this specific offering
    const entitlement = await Entitlement.findOne({
      userId,
      productType: PRODUCT_TYPES.CONTENT_OFFERING,
      productId: offering._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    }).lean();

    const isEntitled = Boolean(entitlement);
    const isFreePreview = Boolean(lesson.isFreePreview);

    if (!isEntitled && !isFreePreview) {
      throw new Error('FORBIDDEN: You must purchase this specific tutor offering to access this content');
    }

    // Return protected lesson playback details
    return {
      lessonId: lesson._id.toString(),
      title: lesson.title,
      duration: lesson.duration,
      transcript: lesson.transcript || null,
      playbackReference: lesson.playbackReference || lesson.videoId?.hlsManifestObjectKey || 'sample_secure_stream.m3u8',
      video: lesson.videoId
        ? {
            id: lesson.videoId._id.toString(),
            duration: lesson.videoId.duration,
            thumbnail: lesson.videoId.thumbnailObjectKey,
            hlsUrl: lesson.videoId.hlsManifestObjectKey,
          }
        : null,
      resources: Array.isArray(lesson.resources)
        ? lesson.resources.map((r) => ({
            id: r._id.toString(),
            name: r.name,
            type: r.type,
            size: r.size,
            downloadUrl: `/api/v1/resources/${r._id}/download`,
          }))
        : [],
    };
  }

  /**
   * 6. POST /api/v1/checkout/offering/:offeringId
   * Authoritative commercial purchase of a Tutor Content Offering
   */
  static async purchaseOffering({ offeringId, userId, paymentMethod = 'ONLINE' }) {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('UNAUTHORIZED: Valid authenticated user required for purchase');
    }

    const offering = await TopicContentOffering.findById(offeringId)
      .populate('instructorId')
      .populate('topicId')
      .lean();

    if (!offering) {
      throw new Error('NOT_FOUND: Tutor offering not found');
    }

    if (offering.status !== 'PUBLISHED') {
      throw new Error('FORBIDDEN: This tutor offering is not currently available for purchase');
    }

    // Check if user already owns this offering
    const existingEntitlement = await Entitlement.findOne({
      userId,
      productType: PRODUCT_TYPES.CONTENT_OFFERING,
      productId: offering._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    if (existingEntitlement) {
      return {
        alreadyOwned: true,
        entitlement: existingEntitlement,
        message: 'You already own this tutor offering.',
      };
    }

    const authoritativePrice = Number(offering.price) || 0;
    const currency = offering.currency || 'INR';
    const orderIdCode = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Order
    const order = await Order.create({
      orderId: orderIdCode,
      userId,
      subtotal: authoritativePrice,
      discount: 0,
      tax: 0,
      credit: 0,
      finalAmount: authoritativePrice,
      currency,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
      orderStatus: ORDER_STATUS.COMPLETED,
    });

    // 2. Create OrderItem
    const orderItem = await OrderItem.create({
      orderId: order._id,
      productType: PRODUCT_TYPES.CONTENT_OFFERING,
      productId: offering._id,
      topicId: offering.topicId?._id || offering.topicId,
      courseId: offering.courseId,
      contentOfferingId: offering._id,
      instructorId: offering.instructorId?._id || offering.instructorId,
      unitPrice: authoritativePrice,
      finalPrice: authoritativePrice,
      currency,
    });

    // 3. Create Payment
    const payment = await Payment.create({
      orderId: order._id,
      userId,
      provider: paymentMethod,
      providerPaymentId: `PAY-${Date.now()}`,
      amount: authoritativePrice,
      currency,
      status: PAYMENT_STATUS.SUCCESS,
      paidAt: new Date(),
    });

    // 4. Create Entitlement tied strictly to this CONTENT_OFFERING
    const entitlement = await Entitlement.create({
      userId,
      productType: PRODUCT_TYPES.CONTENT_OFFERING,
      productId: offering._id,
      courseId: offering.courseId,
      topicId: offering.topicId?._id || offering.topicId,
      contentOfferingId: offering._id,
      orderId: order._id,
      source: 'PURCHASE',
      status: ENTITLEMENT_STATUS.ACTIVE,
      grantedAt: new Date(),
    });

    // 5. Calculate Instructor Earnings & Attribution (80% net instructor, 20% platform commission)
    const platformCommission = Math.round(authoritativePrice * 0.2);
    const netEarning = authoritativePrice - platformCommission;

    if (offering.instructorId) {
      await InstructorEarning.create({
        instructorId: offering.instructorId._id || offering.instructorId,
        orderId: order._id,
        orderItemId: orderItem._id,
        grossAmount: authoritativePrice,
        platformCommission,
        netEarning,
        currency,
        status: 'AVAILABLE',
      });
    }

    // 6. Record Financial Ledger Entries
    await Promise.all([
      FinancialLedger.create({
        userId,
        orderId: order._id,
        type: TRANSACTION_TYPES.ORDER_PAYMENT,
        amount: authoritativePrice,
        currency,
        direction: 'CREDIT',
        description: `Purchase of offering: ${offering.title}`,
      }),
      FinancialLedger.create({
        userId: offering.instructorId?._id || offering.instructorId,
        orderId: order._id,
        type: TRANSACTION_TYPES.INSTRUCTOR_EARNING,
        amount: netEarning,
        currency,
        direction: 'CREDIT',
        description: `Tutor earnings for ${offering.title}`,
      }),
    ]);

    return {
      success: true,
      orderId: order.orderId,
      entitlementId: entitlement._id.toString(),
      offeringTitle: offering.title,
      amount: authoritativePrice,
      currency,
      message: 'Offering purchase successful! You now have full access to this tutor offering.',
    };
  }

  /**
   * 7. POST /api/v1/offerings/:offeringId/progress
   * Update student learning progress for an offering lesson
   */
  static async updateOfferingProgress({ offeringId, lessonId, userId, watchedSeconds = 0, totalSeconds = 0, completed = false }) {
    if (!userId) throw new Error('UNAUTHORIZED: Authentication required');

    const progressPercent = totalSeconds > 0 ? Math.min(100, Math.round((watchedSeconds / totalSeconds) * 100)) : (completed ? 100 : 0);

    const progress = await LearningProgress.findOneAndUpdate(
      { userId, lessonId },
      {
        userId,
        contentOfferingId: offeringId,
        lessonId,
        watchedSeconds,
        totalSeconds,
        progressPercent,
        completed: completed || progressPercent >= 90,
        lastWatchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Also update VideoProgress
    await VideoProgress.findOneAndUpdate(
      { userId, lessonId },
      {
        userId,
        contentOfferingId: offeringId,
        lessonId,
        watchedSeconds,
        totalSeconds,
        progressPercent,
        completed: completed || progressPercent >= 90,
        lastPosition: watchedSeconds,
        lastWatchedAt: new Date(),
      },
      { upsert: true }
    );

    return progress;
  }
}
