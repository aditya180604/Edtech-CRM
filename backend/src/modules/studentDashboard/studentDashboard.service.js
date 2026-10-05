import mongoose from 'mongoose';
import {
  User,
  Course,
  Module,
  Topic,
  Lesson,
  LearningPath,
  Entitlement,
  TopicCredit,
  LearningProgress,
  VideoProgress,
  Certificate,
  Wishlist,
  Order,
  Notification,
  Webinar,
  LiveSession,
  Booking,
  Recommendation,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
} from '../../models/index.js';
import { PRODUCT_TYPES, ENTITLEMENT_STATUS } from '../../config/constants.js';

export class StudentDashboardService {
  /**
   * Main aggregator method for Student Dashboard
   * 2-Stage dependency-aware execution
   * @param {string|ObjectId} userId
   */
  static async getOverview(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // ==========================================
    // STAGE 1: Base State Resolution
    // ==========================================
    const [user, entitlements] = await Promise.all([
      User.findById(userObjectId).lean(),
      Entitlement.find({
        userId: userObjectId,
        status: ENTITLEMENT_STATUS.ACTIVE,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      }).lean(),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    // Derive owned identifiers
    const fullCourseEntitledIds = new Set();
    const entitledCourseIdsSet = new Set();
    const entitledTopicIdsSet = new Set();
    const entitledPathIds = [];

    for (const ent of entitlements) {
      if (ent.productType === PRODUCT_TYPES.COURSE || ent.productType === 'COURSE') {
        const cId = ent.courseId ? ent.courseId.toString() : ent.productId?.toString();
        if (cId) {
          fullCourseEntitledIds.add(cId);
          entitledCourseIdsSet.add(cId);
        }
      } else if (ent.productType === PRODUCT_TYPES.TOPIC || ent.productType === 'TOPIC') {
        const tId = ent.topicId ? ent.topicId.toString() : ent.productId?.toString();
        if (tId) {
          entitledTopicIdsSet.add(tId);
        }
        if (ent.courseId) {
          entitledCourseIdsSet.add(ent.courseId.toString());
        }
      } else if (ent.productType === PRODUCT_TYPES.LEARNING_PATH || ent.productType === 'LEARNING_PATH') {
        const pId = ent.learningPathId || ent.productId;
        if (pId) {
          entitledPathIds.push(new mongoose.Types.ObjectId(pId));
        }
      }
    }

    const allEntitledCourseIds = Array.from(entitledCourseIdsSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const allEntitledTopicIds = Array.from(entitledTopicIdsSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // ==========================================
    // STAGE 2: Parallel Domain Queries via Promise.all
    // ==========================================
    const [
      profileData,
      learningCoursesData,
      topicCreditsData,
      learningHoursData,
      certificatesData,
      wishlistData,
      ordersData,
      notificationsData,
      streakData,
      rankedLiveSessionsData,
      recommendationsData,
      enrolledPathsDocs,
    ] = await Promise.all([
      this._computeProfile(user),
      this._fetchLearningAndCourses(userObjectId, allEntitledCourseIds, allEntitledTopicIds, fullCourseEntitledIds),
      this._fetchTopicCreditsAndUpgrades(userObjectId, allEntitledCourseIds, fullCourseEntitledIds),
      this._computeTotalLearningHours(userObjectId),
      this._fetchCertificates(userObjectId),
      this._fetchWishlist(userObjectId),
      this._fetchRecentOrders(userObjectId),
      this._fetchNotifications(userObjectId),
      this._calculateStreak(userObjectId, user.timezone),
      this._fetchRankedLiveSessions(userObjectId, allEntitledCourseIds, allEntitledTopicIds, user),
      this._fetchRecommendations(userObjectId, Array.from(entitledCourseIdsSet), user),
      entitledPathIds.length > 0
        ? LearningPath.find({ _id: { $in: entitledPathIds } }).lean()
        : [],
    ]);

    const formattedEnrolledPaths = (enrolledPathsDocs || []).map((p) => ({
      id: p._id.toString(),
      learningPathId: p.learningPathId || p._id.toString(),
      title: p.title,
      slug: p.slug || p._id.toString(),
      description: p.description || '',
      career: p.career || null,
      level: p.level || 'ALL_LEVELS',
      estimatedDuration: p.estimatedDuration || null,
      thumbnail: p.thumbnail || null,
    }));

    return {
      profile: profileData,
      stats: {
        activeCoursesCount: learningCoursesData.activeCourses.length,
        purchasedTopicsCount: allEntitledTopicIds.length,
        completedCoursesCount: learningCoursesData.completedCoursesCount,
        certificatesCount: certificatesData.length,
        totalLearningHours: learningHoursData,
        enrolledLearningPathsCount: formattedEnrolledPaths.length,
      },
      streak: streakData,
      activeCourses: learningCoursesData.activeCourses,
      enrolledLearningPaths: formattedEnrolledPaths,
      upgradeOpportunities: topicCreditsData,
      upcomingLiveSessions: rankedLiveSessionsData,
      recentCertificates: certificatesData,
      wishlist: wishlistData,
      recentOrders: ordersData,
      notifications: notificationsData,
      recommendations: recommendationsData,
    };
  }

  /**
   * 1. Profile Completion Formula (Exact 8 Approved Conditions)
   */
  static _computeProfile(user) {
    let completionPercentage = 0;
    const missingFields = [];

    // Identity (20%): firstName AND lastName
    if (user.firstName?.trim() && user.lastName?.trim()) {
      completionPercentage += 20;
    } else {
      if (!user.firstName?.trim()) missingFields.push('firstName');
      if (!user.lastName?.trim()) missingFields.push('lastName');
    }

    // Contact (10%): email AND phone
    if (user.email?.trim() && user.phone?.trim()) {
      completionPercentage += 10;
    } else {
      if (!user.phone?.trim()) missingFields.push('phone');
    }

    // Photo (10%): profilePhoto
    if (user.profilePhoto?.trim()) {
      completionPercentage += 10;
    } else {
      missingFields.push('profilePhoto');
    }

    // Location (10%): country AND timezone
    if (user.country?.trim() && user.timezone?.trim()) {
      completionPercentage += 10;
    } else {
      if (!user.country?.trim()) missingFields.push('country');
      if (!user.timezone?.trim()) missingFields.push('timezone');
    }

    // Preferences (10%): preferredLanguage AND learningPreferences
    const hasPreferences =
      user.learningPreferences &&
      (typeof user.learningPreferences === 'string'
        ? user.learningPreferences.trim().length > 0
        : typeof user.learningPreferences === 'object' &&
          Object.keys(user.learningPreferences).length > 0);

    if (user.preferredLanguage?.trim() && hasPreferences) {
      completionPercentage += 10;
    } else {
      if (!user.preferredLanguage?.trim()) missingFields.push('preferredLanguage');
      if (!hasPreferences) missingFields.push('learningPreferences');
    }

    // Skills (15%): skills.length >= 1
    if (Array.isArray(user.skills) && user.skills.length >= 1) {
      completionPercentage += 15;
    } else {
      missingFields.push('skills');
    }

    // Interests (15%): interests.length >= 1
    if (Array.isArray(user.interests) && user.interests.length >= 1) {
      completionPercentage += 15;
    } else {
      missingFields.push('interests');
    }

    // Education (10%): qualification OR institution
    if (user.qualification?.trim() || user.institution?.trim()) {
      completionPercentage += 10;
    } else {
      missingFields.push('qualification/institution');
    }

    return {
      userId: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || null,
      profilePhoto: user.profilePhoto || null,
      country: user.country || null,
      timezone: user.timezone || null,
      preferredLanguage: user.preferredLanguage || null,
      learningPreferences:
        typeof user.learningPreferences === 'string'
          ? user.learningPreferences
          : user.learningPreferences
          ? JSON.stringify(user.learningPreferences)
          : null,
      qualification: user.qualification || null,
      institution: user.institution || null,
      skills: Array.isArray(user.skills) ? user.skills : [],
      interests: Array.isArray(user.interests) ? user.interests : [],
      status: user.status || 'ACTIVE',
      completionPercentage,
      missingFields,
    };
  }

  /**
   * 2. Active & Completed Courses and Entitled Progress
   */
  static async _fetchLearningAndCourses(userId, entitledCourseObjectIds, entitledTopicObjectIds, fullCourseEntitledIds) {
    if (entitledCourseObjectIds.length === 0) {
      return { activeCourses: [], completedCoursesCount: 0 };
    }

    // Fetch courses with instructor info
    const courses = await Course.find({ _id: { $in: entitledCourseObjectIds } })
      .populate('instructorId', 'firstName lastName profilePhoto')
      .lean();

    // Fetch modules, topics, lessons for these courses
    const [modules, topics] = await Promise.all([
      Module.find({ courseId: { $in: entitledCourseObjectIds } }).lean(),
      Topic.find({ courseId: { $in: entitledCourseObjectIds } }).lean(),
    ]);

    const courseTopicIds = topics.map((t) => t._id);
    const [lessons, userProgress, quizAttempts, assignmentSubs, courseQuizzes, courseAssignments] =
      await Promise.all([
        Lesson.find({ topicId: { $in: courseTopicIds } }).lean(),
        LearningProgress.find({ userId }).lean(),
        QuizAttempt.find({ userId }).lean(),
        AssignmentSubmission.find({ userId }).lean(),
        Quiz.find({
          $or: [
            { courseId: { $in: entitledCourseObjectIds } },
            { topicId: { $in: courseTopicIds } },
          ],
          status: 'ACTIVE',
        }).lean(),
        Assignment.find({
          $or: [
            { courseId: { $in: entitledCourseObjectIds } },
            { topicId: { $in: courseTopicIds } },
          ],
          status: 'ACTIVE',
        }).lean(),
      ]);

    const activeCourses = [];
    let completedCoursesCount = 0;

    for (const course of courses) {
      const courseIdStr = course._id.toString();
      const isFullCourseEnrolled = fullCourseEntitledIds.has(courseIdStr);

      const courseTopics = topics.filter((t) => t.courseId?.toString() === courseIdStr);
      const totalCourseTopicsCount = courseTopics.length;

      // Filter topics entitled to user for this course
      const userEnrolledTopics = courseTopics.filter(
        (t) => isFullCourseEnrolled || entitledTopicObjectIds.some((etId) => etId.toString() === t._id.toString())
      );
      const enrolledTopicsCount = userEnrolledTopics.length;

      // Lessons entitled to this student
      const userEnrolledTopicIds = new Set(userEnrolledTopics.map((t) => t._id.toString()));
      const allCourseTopicIds = new Set(courseTopics.map((t) => t._id.toString()));

      const entitledLessons = lessons.filter(
        (l) => l.topicId && userEnrolledTopicIds.has(l.topicId.toString())
      );

      const totalEntitledLessons = entitledLessons.length;

      // Count completed lessons among entitled
      const completedLessonIds = new Set(
        userProgress.filter((p) => p.completed).map((p) => p.lessonId?.toString())
      );

      let completedEntitledLessonsCount = 0;
      for (const l of entitledLessons) {
        if (completedLessonIds.has(l._id.toString())) {
          completedEntitledLessonsCount++;
        }
      }

      const entitledProgressPercentage =
        totalEntitledLessons > 0
          ? Math.round((completedEntitledLessonsCount / totalEntitledLessons) * 100)
          : 0;

      // Check for Full Course Completion (Non-circular lifecycle: Content + Quizzes + Assignments)
      const allCourseLessons = lessons.filter(
        (l) => l.topicId && allCourseTopicIds.has(l.topicId.toString())
      );
      const totalCourseLessonsCount = allCourseLessons.length;
      let totalCourseLessonsCompleted = 0;
      for (const l of allCourseLessons) {
        if (completedLessonIds.has(l._id.toString())) {
          totalCourseLessonsCompleted++;
        }
      }

      const isContentComplete =
        totalCourseLessonsCount > 0 && totalCourseLessonsCompleted === totalCourseLessonsCount;

      // Quizzes gate for this course
      const applicableQuizzes = courseQuizzes.filter(
        (q) =>
          q.courseId?.toString() === courseIdStr ||
          (q.topicId && allCourseTopicIds.has(q.topicId.toString()))
      );
      const allQuizzesPassed = applicableQuizzes.every((q) => {
        const qId = q._id.toString();
        const minPass = q.passingScore != null ? q.passingScore : 70;
        return quizAttempts.some(
          (qa) =>
            qa.quizId?.toString() === qId &&
            (qa.passed === true ||
              (qa.score != null && qa.score >= minPass) ||
              (qa.percentage != null && qa.percentage >= minPass))
        );
      });

      // Assignments gate for this course
      const applicableAssignments = courseAssignments.filter(
        (a) =>
          a.courseId?.toString() === courseIdStr ||
          (a.topicId && allCourseTopicIds.has(a.topicId.toString()))
      );
      const allAssignmentsSubmitted = applicableAssignments.every((a) => {
        const aId = a._id.toString();
        return assignmentSubs.some(
          (sub) => sub.assignmentId?.toString() === aId && sub.status !== 'REJECTED'
        );
      });

      // Full course completion requires: Full ownership + Complete Content + Passed Quizzes + Submitted Assignments
      const isFullyCompleted =
        isFullCourseEnrolled &&
        isContentComplete &&
        allQuizzesPassed &&
        allAssignmentsSubmitted;

      if (isFullyCompleted) {
        completedCoursesCount++;
      } else {
        // Last accessed lesson
        const courseProgressList = userProgress
          .filter((p) => p.courseId?.toString() === courseIdStr)
          .sort((a, b) => new Date(b.lastWatchedAt || b.updatedAt) - new Date(a.lastWatchedAt || a.updatedAt));

        let lastAccessedLesson = null;
        if (courseProgressList.length > 0) {
          const lastProg = courseProgressList[0];
          const lessonDoc = lessons.find((l) => l._id.toString() === lastProg.lessonId?.toString());
          if (lessonDoc) {
            lastAccessedLesson = {
              lessonId: lessonDoc._id.toString(),
              title: lessonDoc.title || 'Lesson',
              topicId: lessonDoc.topicId ? lessonDoc.topicId.toString() : '',
            };
          }
        }

        const instructor = course.instructorId;
        const instructorName = instructor
          ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Expert Instructor'
          : 'Expert Instructor';

        activeCourses.push({
          courseId: course._id.toString(),
          title: course.title || '',
          slug: course.slug || '',
          thumbnail: course.thumbnail || null,
          instructorName,
          enrolledTopicsCount,
          totalCourseTopicsCount,
          isFullCourseEnrolled,
          entitledProgressPercentage,
          lastAccessedLesson,
        });
      }
    }

    return { activeCourses, completedCoursesCount };
  }

  /**
   * 3. Topic Credits & Multi-Currency Safe Course Upgrades
   */
  static async _fetchTopicCreditsAndUpgrades(userId, entitledCourseObjectIds, fullCourseEntitledIds) {
    const credits = await TopicCredit.find({
      userId,
      status: 'ACTIVE',
      remainingAmount: { $gt: 0 },
    }).lean();

    if (credits.length === 0) {
      return [];
    }

    // Group credits by courseId
    const creditsByCourse = new Map();
    for (const c of credits) {
      if (!c.courseId) continue;
      const cId = c.courseId.toString();
      // If already full course enrolled, upgrade is not needed
      if (fullCourseEntitledIds.has(cId)) continue;

      const current = creditsByCourse.get(cId) || 0;
      creditsByCourse.set(cId, current + (c.remainingAmount || 0));
    }

    const courseIdsToUpgrade = Array.from(creditsByCourse.keys()).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    if (courseIdsToUpgrade.length === 0) {
      return [];
    }

    const courses = await Course.find({ _id: { $in: courseIdsToUpgrade } }).lean();
    const upgradeOpportunities = [];

    for (const course of courses) {
      const cId = course._id.toString();
      const accumulatedCredit = creditsByCourse.get(cId) || 0;
      const fullCoursePrice = course.coursePrice || 0;
      const upgradePrice = Math.max(0, fullCoursePrice - accumulatedCredit);

      upgradeOpportunities.push({
        courseId: cId,
        courseTitle: course.title || '',
        courseSlug: course.slug || '',
        thumbnail: course.thumbnail || null,
        currency: course.currency || 'USD',
        fullCoursePrice,
        accumulatedCredit,
        upgradePrice,
        eligibleTopicCount: credits.filter((cr) => cr.courseId?.toString() === cId).length,
      });
    }

    return upgradeOpportunities;
  }

  /**
   * 4. Authoritative Total Learning Hours (from VideoProgress)
   */
  static async _computeTotalLearningHours(userId) {
    const videoProgressList = await VideoProgress.find({ userId }).select('watchedSeconds').lean();
    const totalSeconds = videoProgressList.reduce((acc, curr) => acc + (curr.watchedSeconds || 0), 0);
    return Number((totalSeconds / 3600).toFixed(1));
  }

  /**
   * 5. Issued Certificates (Strict Referential Integrity - No Fabricated Titles)
   */
  static async _fetchCertificates(userId) {
    const certs = await Certificate.find({ userId, status: 'ISSUED' })
      .populate('courseId', 'title slug thumbnail')
      .sort({ issueDate: -1 })
      .lean();

    return certs.map((c) => ({
      certificateId: c._id.toString(),
      certificateNumber: c.certificateNumber || '',
      courseTitle: c.courseId?.title || null,
      issueDate: c.issueDate ? new Date(c.issueDate).toISOString() : new Date().toISOString(),
      verificationUrl: c.verificationUrl || `/verify/${c.certificateNumber}`,
      certificateAssetUrl: c.certificateAssetUrl || null,
    }));
  }

  /**
   * 6. Wishlist Items
   */
  static async _fetchWishlist(userId) {
    const items = await Wishlist.find({ userId }).sort({ createdAt: -1 }).limit(6).lean();
    if (items.length === 0) return [];

    const productIds = items.map((i) => i.productId);
    const [courses, topics, webinars] = await Promise.all([
      Course.find({ _id: { $in: productIds } }).lean(),
      Topic.find({ _id: { $in: productIds } }).lean(),
      Webinar.find({ _id: { $in: productIds } }).lean(),
    ]);

    const result = [];
    for (const item of items) {
      const pId = item.productId.toString();
      if (item.productType === 'COURSE') {
        const c = courses.find((x) => x._id.toString() === pId);
        if (c) {
          result.push({
            wishlistId: item._id.toString(),
            productType: 'COURSE',
            productId: pId,
            title: c.title || '',
            slug: c.slug || '',
            thumbnail: c.thumbnail || null,
            price: c.coursePrice || 0,
            currency: c.currency || 'USD',
          });
        }
      } else if (item.productType === 'TOPIC') {
        const t = topics.find((x) => x._id.toString() === pId);
        if (t) {
          result.push({
            wishlistId: item._id.toString(),
            productType: 'TOPIC',
            productId: pId,
            title: t.title || '',
            slug: t.slug || '',
            thumbnail: null,
            price: t.price || 0,
            currency: t.currency || 'USD',
          });
        }
      } else if (item.productType === 'WEBINAR') {
        const w = webinars.find((x) => x._id.toString() === pId);
        if (w) {
          result.push({
            wishlistId: item._id.toString(),
            productType: 'WEBINAR',
            productId: pId,
            title: w.title || '',
            slug: w.slug || '',
            thumbnail: w.thumbnail || null,
            price: w.price || 0,
            currency: w.currency || 'USD',
          });
        }
      }
    }

    return result;
  }

  /**
   * Toggle item in user's wishlist
   */
  static async toggleWishlist(userId, { productId, productType = 'COURSE' }) {
    const existing = await Wishlist.findOne({ userId, productId });
    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return { added: false, message: 'Removed from wishlist' };
    }
    const item = await Wishlist.create({
      userId,
      productId,
      productType,
    });
    return { added: true, wishlistId: item._id.toString(), message: 'Added to wishlist' };
  }

  /**
   * Get all wishlisted productIds for the user
   */
  static async getWishlistIds(userId) {
    const items = await Wishlist.find({ userId }).select('productId').lean();
    return items.map((i) => i.productId.toString());
  }

  /**
   * 7. Recent Orders (strictly mapped to Order schema)
   */
  static async _fetchRecentOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    return orders.map((o) => {
      let itemTitle = 'Course Purchase';
      if (Array.isArray(o.items) && o.items.length > 0) {
        const first = o.items[0];
        itemTitle = first.title || first.productName || (first.productType === 'TOPIC' ? `${first.title || 'Topic'} (Topic)` : `${first.title || 'Course'}`);
        if (o.items.length > 1) {
          itemTitle += ` (+${o.items.length - 1} more)`;
        }
      }
      return {
        orderId: o.orderId || o._id.toString(),
        orderNumber: o.orderId || o._id.toString(),
        itemTitle,
        totalAmount: o.finalAmount != null ? o.finalAmount : (o.subtotal || 0),
        payableAmount: o.finalAmount != null ? o.finalAmount : 0,
        currency: o.currency || 'INR',
        status: o.orderStatus || o.paymentStatus || 'PAID',
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        itemsCount: Array.isArray(o.items) ? o.items.length : 1,
      };
    });
  }

  /**
   * 8. Notifications
   */
  static async _fetchNotifications(userId) {
    const [unreadCount, recent] = await Promise.all([
      Notification.countDocuments({ userId, isRead: false }),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return {
      unreadCount,
      recent: recent.map((n) => ({
        notificationId: n.notificationId || n._id.toString(),
        type: n.type || 'SYSTEM',
        title: n.title || '',
        message: n.message || '',
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      })),
    };
  }

  /**
   * 9. Exact Streak Calculation (All 8 Qualifying Conditions with Timezone Support)
   * Enforces 5 continuous minutes (maxContinuousSeconds >= 300) without cumulative bypass
   */
  static async _calculateStreak(userId, timezone = 'UTC') {
    const [learningLogs, quizAttempts, assignmentSubs, videoProgressLogs, bookings] = await Promise.all([
      LearningProgress.find({ userId, completed: true }).select('updatedAt lastWatchedAt').lean(),
      QuizAttempt.find({ userId, status: 'COMPLETED' }).select('completedAt createdAt').lean(),
      AssignmentSubmission.find({ userId }).select('submittedAt createdAt').lean(),
      VideoProgress.find({
        userId,
        $or: [
          { progressPercent: { $gte: 20 } },
          { maxContinuousSeconds: { $gte: 300 } },
        ],
      })
        .select('lastWatchedAt updatedAt')
        .lean(),
      Booking.find({
        userId,
        status: 'ATTENDED',
        attendedMinutes: { $gte: 15 },
      })
        .select('attendedAt bookedAt updatedAt')
        .lean(),
    ]);

    const activeDateStrings = new Set();
    const formatter = (() => {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      } catch {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
    })();

    const addDate = (d) => {
      if (!d) return;
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        activeDateStrings.add(formatter.format(parsed));
      }
    };

    learningLogs.forEach((l) => {
      addDate(l.lastWatchedAt || l.updatedAt);
    });

    quizAttempts.forEach((q) => {
      addDate(q.completedAt || q.createdAt);
    });

    assignmentSubs.forEach((a) => {
      addDate(a.submittedAt || a.createdAt);
    });

    videoProgressLogs.forEach((v) => {
      addDate(v.lastWatchedAt || v.updatedAt);
    });

    bookings.forEach((b) => {
      addDate(b.attendedAt || b.bookedAt || b.updatedAt);
    });

    if (activeDateStrings.size === 0) {
      return {
        currentStreak: 0,
        lastActiveDate: null,
        isActiveToday: false,
      };
    }

    const now = new Date();
    const todayStr = formatter.format(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatter.format(yesterday);

    const isActiveToday = activeDateStrings.has(todayStr);
    let currentStreak = 0;
    let checkDate = new Date(now.getTime());

    if (!isActiveToday && !activeDateStrings.has(yesterdayStr)) {
      // Streak broken
      const sortedDates = Array.from(activeDateStrings).sort();
      return {
        currentStreak: 0,
        lastActiveDate: sortedDates[sortedDates.length - 1],
        isActiveToday: false,
      };
    }

    if (!isActiveToday) {
      checkDate = yesterday;
    }

    while (true) {
      const dateStr = formatter.format(checkDate);
      if (activeDateStrings.has(dateStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }

    const sortedDates = Array.from(activeDateStrings).sort();
    return {
      currentStreak,
      lastActiveDate: sortedDates[sortedDates.length - 1],
      isActiveToday,
    };
  }

  /**
   * 10. Ranked Live Sessions
   */
  static async _fetchRankedLiveSessions(userId, entitledCourseObjectIds, entitledTopicObjectIds, user) {
    const now = new Date();

    const [userBookings, upcomingWebinars] = await Promise.all([
      Booking.find({ userId, status: 'CONFIRMED' })
        .populate({
          path: 'liveSessionId',
          populate: { path: 'webinarId', populate: { path: 'instructorId', select: 'firstName lastName' } },
        })
        .lean(),
      Webinar.find({
        status: { $in: ['SCHEDULED', 'LIVE'] },
        startTime: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }, // current or upcoming
      })
        .populate('instructorId', 'firstName lastName')
        .sort({ startTime: 1 })
        .limit(10)
        .lean(),
    ]);

    const bookedWebinarIds = new Set();
    const rankedList = [];

    // 1. Booked Sessions
    for (const b of userBookings) {
      const ls = b.liveSessionId;
      const w = ls?.webinarId;
      if (w) {
        bookedWebinarIds.add(w._id.toString());
        const instructor = w.instructorId;
        rankedList.push({
          sessionId: ls._id.toString(),
          title: w.title || 'Live Workshop',
          type: 'WEBINAR',
          scheduledAt: w.startTime ? new Date(w.startTime).toISOString() : new Date().toISOString(),
          durationMinutes: Math.round(((w.endTime || w.startTime) - w.startTime) / 60000) || 60,
          instructorName: instructor
            ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Lead Instructor'
            : 'Lead Instructor',
          isBooked: true,
          priorityReason: 'BOOKED',
          meetingUrl: w.meetingUrl || null,
        });
      }
    }

    const entitledCourseIdStrs = new Set(entitledCourseObjectIds.map((id) => id.toString()));
    const entitledTopicIdStrs = new Set(entitledTopicObjectIds.map((id) => id.toString()));
    const userInterests = new Set(user.interests || []);

    // 2-5: Evaluate remaining upcoming webinars
    for (const w of upcomingWebinars) {
      const wId = w._id.toString();
      if (bookedWebinarIds.has(wId)) continue;

      let priorityReason = 'PUBLIC';
      if (w.courseId && entitledCourseIdStrs.has(w.courseId.toString())) {
        priorityReason = 'ENROLLED_COURSE';
      } else if (w.topicId && entitledTopicIdStrs.has(w.topicId.toString())) {
        priorityReason = 'ENROLLED_TOPIC';
      } else if (w.category && userInterests.has(w.category)) {
        priorityReason = 'INTEREST_MATCH';
      }

      const instructor = w.instructorId;
      rankedList.push({
        sessionId: w._id.toString(),
        title: w.title || 'Live Session',
        type: 'WEBINAR',
        scheduledAt: w.startTime ? new Date(w.startTime).toISOString() : new Date().toISOString(),
        durationMinutes: Math.round(((w.endTime || w.startTime) - w.startTime) / 60000) || 60,
        instructorName: instructor
          ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Lead Instructor'
          : 'Lead Instructor',
        isBooked: false,
        priorityReason,
        meetingUrl: null, // meetingUrl protected until booked
      });
    }

    // Sort by priority order: BOOKED -> ENROLLED_COURSE -> ENROLLED_TOPIC -> INTEREST_MATCH -> PUBLIC
    const priorityWeight = {
      BOOKED: 5,
      ENROLLED_COURSE: 4,
      ENROLLED_TOPIC: 3,
      INTEREST_MATCH: 2,
      PUBLIC: 1,
    };

    rankedList.sort((a, b) => {
      const diff = (priorityWeight[b.priorityReason] || 0) - (priorityWeight[a.priorityReason] || 0);
      if (diff !== 0) return diff;
      return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    });

    return rankedList.slice(0, 5);
  }

  /**
   * 11. Deterministic Course Recommendations (Strict Signal-Driven, No Generic Fallbacks)
   */
  static async _fetchRecommendations(userId, ownedCourseIdStrs, user) {
    const ownedObjectIds = ownedCourseIdStrs.map((id) => new mongoose.Types.ObjectId(id));
    const resultRecommendations = [];
    const addedCourseIds = new Set(ownedCourseIdStrs);

    // 1. Signal 1: Pre-computed Recommendation Documents in MongoDB
    const precomputedRecs = await Recommendation.find({
      userId,
      recommendedEntityType: 'Course',
      recommendedEntityId: { $nin: ownedObjectIds },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .sort({ score: -1 })
      .limit(4)
      .lean();

    if (precomputedRecs.length > 0) {
      const recCourseIds = precomputedRecs.map((r) => r.recommendedEntityId);
      const courses = await Course.find({
        _id: { $in: recCourseIds, $nin: ownedObjectIds },
        status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
      }).lean();

      for (const c of courses) {
        const cId = c._id.toString();
        if (!addedCourseIds.has(cId)) {
          addedCourseIds.add(cId);
          const r = precomputedRecs.find((x) => x.recommendedEntityId.toString() === cId);
          resultRecommendations.push({
            courseId: cId,
            title: c.title || c.name || '',
            slug: c.slug || (c.title ? c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : cId),
            thumbnail: c.thumbnail || c.banner || c.image || null,
            coursePrice: c.coursePrice != null ? c.coursePrice : (c.rawFee || 0),
            currency: c.currency || 'INR',
            category: c.category || c.cat || 'Technology',
            level: c.level || 'ALL_LEVELS',
            reason: r?.reason || 'Recommended based on your learning journey',
          });
        }
      }
    }

    if (resultRecommendations.length >= 4) {
      return resultRecommendations.slice(0, 4);
    }

    const escapeRegex = (str) => (typeof str === 'string' ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

    // 2. Signal 2: Student Profile Interests (user.interests)
    const userInterests = Array.isArray(user.interests)
      ? user.interests.map((i) => i?.trim()).filter(Boolean)
      : [];

    if (userInterests.length > 0) {
      const interestOrClauses = [];
      for (const interest of userInterests) {
        const regex = new RegExp(escapeRegex(interest), 'i');
        interestOrClauses.push(
          { title: regex },
          { name: regex },
          { category: regex },
          { cat: regex },
          { subcategory: regex },
          { skills: regex },
          { description: regex }
        );
      }

      const interestCourses = await Course.find({
        _id: { $nin: Array.from(addedCourseIds).map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
        $or: interestOrClauses,
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(4 - resultRecommendations.length)
        .lean();

      for (const c of interestCourses) {
        const cId = c._id.toString();
        if (!addedCourseIds.has(cId)) {
          addedCourseIds.add(cId);
          const matchedInterest =
            userInterests.find((interest) => {
              const r = new RegExp(escapeRegex(interest), 'i');
              return (
                r.test(c.title || '') ||
                r.test(c.name || '') ||
                r.test(c.category || '') ||
                r.test(c.cat || '') ||
                (Array.isArray(c.skills) && c.skills.some((sk) => r.test(sk)))
              );
            }) || userInterests[0];

          resultRecommendations.push({
            courseId: cId,
            title: c.title || c.name || '',
            slug: c.slug || (c.title ? c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : cId),
            thumbnail: c.thumbnail || c.banner || c.image || null,
            coursePrice: c.coursePrice != null ? c.coursePrice : (c.rawFee || 0),
            currency: c.currency || 'INR',
            category: c.category || c.cat || 'General',
            level: c.level || 'ALL_LEVELS',
            reason: `Matches your interest in ${matchedInterest}`,
          });
        }
      }
    }

    if (resultRecommendations.length >= 4) {
      return resultRecommendations.slice(0, 4);
    }

    // 3. Signal 3: Student Profile Skills (user.skills)
    const userSkills = Array.isArray(user.skills)
      ? user.skills.map((s) => s?.trim()).filter(Boolean)
      : [];

    if (userSkills.length > 0) {
      const skillOrClauses = [];
      for (const skill of userSkills) {
        const regex = new RegExp(escapeRegex(skill), 'i');
        skillOrClauses.push(
          { skills: regex },
          { title: regex },
          { name: regex },
          { category: regex },
          { cat: regex },
          { description: regex }
        );
      }

      const skillCourses = await Course.find({
        _id: { $nin: Array.from(addedCourseIds).map((id) => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
        $or: skillOrClauses,
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(4 - resultRecommendations.length)
        .lean();

      for (const c of skillCourses) {
        const cId = c._id.toString();
        if (!addedCourseIds.has(cId)) {
          addedCourseIds.add(cId);
          const matchedSkill =
            userSkills.find((skill) => {
              const r = new RegExp(escapeRegex(skill), 'i');
              return (
                (Array.isArray(c.skills) && c.skills.some((sk) => r.test(sk))) ||
                r.test(c.title || '') ||
                r.test(c.name || '')
              );
            }) || userSkills[0];

          resultRecommendations.push({
            courseId: cId,
            title: c.title || c.name || '',
            slug: c.slug || (c.title ? c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : cId),
            thumbnail: c.thumbnail || c.banner || c.image || null,
            coursePrice: c.coursePrice != null ? c.coursePrice : (c.rawFee || 0),
            currency: c.currency || 'INR',
            category: c.category || c.cat || 'General',
            level: c.level || 'ALL_LEVELS',
            reason: `Helps develop your skill in ${matchedSkill}`,
          });
        }
      }
    }

    if (resultRecommendations.length >= 4) {
      return resultRecommendations.slice(0, 4);
    }

    // 4. Signal 4: Learning Activity & Completed Topic / Course Category Affinity
    const recentProgress = await LearningProgress.find({
      userId,
      completed: true,
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('courseId topicId')
      .lean();

    if (recentProgress.length > 0) {
      const activeCourseIds = recentProgress.map((p) => p.courseId).filter(Boolean);
      if (activeCourseIds.length > 0) {
        const completedCourses = await Course.find({ _id: { $in: activeCourseIds } }).select('category cat subcategory').lean();
        const affinityCategories = Array.from(
          new Set(completedCourses.map((c) => c.category || c.cat).filter(Boolean))
        );

        if (affinityCategories.length > 0) {
          const affinityCourses = await Course.find({
            _id: { $nin: Array.from(addedCourseIds).map((id) => new mongoose.Types.ObjectId(id)) },
            status: { $in: ['PUBLISHED', 'Active', 'ACTIVE', 'published'] },
            $or: [{ category: { $in: affinityCategories } }, { cat: { $in: affinityCategories } }],
          })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(4 - resultRecommendations.length)
            .lean();

          for (const c of affinityCourses) {
            const cId = c._id.toString();
            if (!addedCourseIds.has(cId)) {
              addedCourseIds.add(cId);
              resultRecommendations.push({
                courseId: cId,
                title: c.title || c.name || '',
                slug: c.slug || (c.title ? c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : cId),
                thumbnail: c.thumbnail || c.banner || c.image || null,
                coursePrice: c.coursePrice != null ? c.coursePrice : (c.rawFee || 0),
                currency: c.currency || 'INR',
                category: c.category || c.cat || 'General',
                level: c.level || 'ALL_LEVELS',
                reason: `Based on your recent learning in ${c.category || c.cat}`,
              });
            }
          }
        }
      }
    }

    // Absolutely NO fallback to generic/popular/latest published courses!
    // If student has no signal, return genuine empty list []
    return resultRecommendations.slice(0, 4);
  }
}
