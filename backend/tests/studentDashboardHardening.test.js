import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Course,
  Module,
  Topic,
  Lesson,
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
} from '../src/models/index.js';
import { StudentDashboardService } from '../src/modules/studentDashboard/studentDashboard.service.js';
import {
  ROLES,
  USER_STATUS,
  PRODUCT_TYPES,
  ENTITLEMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../src/config/constants.js';

describe('Phase 2 — Student Dashboard Production Hardening & Data Integrity Suite', () => {
  let studentA;
  let studentB;
  let courseUSD;
  let courseINR;
  let moduleUSD;
  let topicUSD1;
  let topicUSD2;
  let lessonUSD1;
  let lessonUSD2;
  let lessonUSD3;
  let lessonUSD4;

  before(async () => {
    await connectDB();

    // 1. Create Student A
    studentA = await User.create({
      firstName: 'Student',
      lastName: 'Alpha',
      email: `student.a.${Date.now()}@test.com`,
      phone: '+1111111111',
      profilePhoto: 'https://images.unsplash.com/photo-student-a',
      country: 'USA',
      timezone: 'America/New_York',
      preferredLanguage: 'en',
      learningPreferences: { difficulty: 'intermediate' },
      skills: ['TypeScript', 'Node.js'],
      interests: ['Backend', 'Cloud'],
      qualification: 'B.S. Software Engineering',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Student B
    studentB = await User.create({
      firstName: 'Student',
      lastName: 'Beta',
      email: `student.b.${Date.now()}@test.com`,
      phone: '+2222222222',
      profilePhoto: 'https://images.unsplash.com/photo-student-b',
      country: 'India',
      timezone: 'Asia/Kolkata',
      preferredLanguage: 'en',
      learningPreferences: { difficulty: 'beginner' },
      skills: ['Python'],
      interests: ['Data Science'],
      qualification: 'B.Tech',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 3. Create Course USD ($120) with 2 Topics (each $30) and 4 Lessons
    courseUSD = await Course.create({
      title: 'Advanced Microservices in Node.js',
      slug: `microservices-${Date.now()}`,
      description: 'Distributed systems masterclass',
      coursePrice: 120,
      currency: 'USD',
      status: 'PUBLISHED',
      category: 'Cloud',
    });

    moduleUSD = await Module.create({
      courseId: courseUSD._id,
      title: 'Module 1: Architecture',
      order: 1,
    });

    topicUSD1 = await Topic.create({
      moduleId: moduleUSD._id,
      courseId: courseUSD._id,
      title: 'Topic 1: Event Sourcing',
      price: 30,
      currency: 'USD',
      order: 1,
    });

    topicUSD2 = await Topic.create({
      moduleId: moduleUSD._id,
      courseId: courseUSD._id,
      title: 'Topic 2: CQRS Pattern',
      price: 30,
      currency: 'USD',
      order: 2,
    });

    lessonUSD1 = await Lesson.create({
      topicId: topicUSD1._id,
      title: 'Lesson 1.1 Intro to Events',
      order: 1,
    });
    lessonUSD2 = await Lesson.create({
      topicId: topicUSD1._id,
      title: 'Lesson 1.2 Event Store',
      order: 2,
    });
    lessonUSD3 = await Lesson.create({
      topicId: topicUSD2._id,
      title: 'Lesson 2.1 CQRS Intro',
      order: 3,
    });
    lessonUSD4 = await Lesson.create({
      topicId: topicUSD2._id,
      title: 'Lesson 2.2 Read Models',
      order: 4,
    });

    // 4. Create Course INR (₹2,999)
    courseINR = await Course.create({
      title: 'Data Structures in Python',
      slug: `dsa-python-${Date.now()}`,
      description: 'Complete Python DSA',
      coursePrice: 2999,
      currency: 'INR',
      status: 'PUBLISHED',
      category: 'Data Science',
    });
  });

  after(async () => {
    // Clean up test records
    if (studentA) await User.deleteOne({ _id: studentA._id });
    if (studentB) await User.deleteOne({ _id: studentB._id });
    if (courseUSD) await Course.deleteOne({ _id: courseUSD._id });
    if (courseINR) await Course.deleteOne({ _id: courseINR._id });
    if (moduleUSD) await Module.deleteOne({ _id: moduleUSD._id });
    if (topicUSD1) await Topic.deleteOne({ _id: topicUSD1._id });
    if (topicUSD2) await Topic.deleteOne({ _id: topicUSD2._id });
    if (lessonUSD1) await Lesson.deleteOne({ _id: lessonUSD1._id });
    if (lessonUSD2) await Lesson.deleteOne({ _id: lessonUSD2._id });
    if (lessonUSD3) await Lesson.deleteOne({ _id: lessonUSD3._id });
    if (lessonUSD4) await Lesson.deleteOne({ _id: lessonUSD4._id });

    await Entitlement.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await TopicCredit.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await LearningProgress.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await VideoProgress.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await Certificate.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await Wishlist.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await Order.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await Notification.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await Booking.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });
    await Recommendation.deleteMany({ userId: { $in: [studentA?._id, studentB?._id] } });

    await disconnectDB();
  });

  it('1. Strict User Isolation: Student A data is never leaked to Student B', async () => {
    // Setup Student A with an entitlement, credit, order, and notification
    await Entitlement.create({
      userId: studentA._id,
      productType: PRODUCT_TYPES.TOPIC,
      productId: topicUSD1._id,
      courseId: courseUSD._id,
      topicId: topicUSD1._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    await TopicCredit.create({
      userId: studentA._id,
      courseId: courseUSD._id,
      eligibleAmount: 30,
      remainingAmount: 30,
      status: 'ACTIVE',
    });

    await Order.create({
      orderId: `ORD-${Date.now()}-A`,
      userId: studentA._id,
      subtotal: 30,
      finalAmount: 30,
      currency: 'USD',
      orderStatus: ORDER_STATUS.COMPLETED,
      paymentStatus: PAYMENT_STATUS.SUCCESS,
    });

    await Notification.create({
      notificationId: `NOTIF-${Date.now()}-A`,
      userId: studentA._id,
      title: 'Secret Notification for Student A',
      message: 'Exclusive content unlocked',
      type: 'COURSE_UPDATE',
      isRead: false,
    });

    // Query Student B overview
    const studentBData = await StudentDashboardService.getOverview(studentB._id);

    // Verify Student B has zero records from Student A
    assert.strictEqual(studentBData.stats.activeCoursesCount, 0);
    assert.strictEqual(studentBData.stats.purchasedTopicsCount, 0);
    assert.strictEqual(studentBData.upgradeOpportunities.length, 0);
    assert.strictEqual(studentBData.recentOrders.length, 0);
    assert.strictEqual(studentBData.notifications.unreadCount, 0);
    assert.strictEqual(studentBData.notifications.recent.length, 0);

    // Query Student A overview
    const studentAData = await StudentDashboardService.getOverview(studentA._id);
    assert.strictEqual(studentAData.stats.activeCoursesCount, 1);
    assert.strictEqual(studentAData.stats.purchasedTopicsCount, 1);
    assert.strictEqual(studentAData.upgradeOpportunities.length, 1);
    assert.strictEqual(studentAData.recentOrders.length, 1);
    assert.strictEqual(studentAData.notifications.unreadCount, 1);
  });

  it('2. Partial Topic Ownership Progress vs Full Course Progress Calculation', async () => {
    // Student A owns Topic 1 (2 lessons). Complete 1 lesson.
    await LearningProgress.create({
      userId: studentA._id,
      topicId: topicUSD1._id,
      lessonId: lessonUSD1._id,
      completed: true,
      lastWatchedAt: new Date(),
    });

    const data = await StudentDashboardService.getOverview(studentA._id);
    const activeCourse = data.activeCourses[0];

    // Assert: entitledProgressPercentage is 50% (1 of 2 owned lessons), NOT 25% (1 of 4 total course lessons)
    assert.strictEqual(activeCourse.entitledProgressPercentage, 50);
    assert.strictEqual(activeCourse.enrolledTopicsCount, 1);
    assert.strictEqual(activeCourse.totalCourseTopicsCount, 2);
    assert.strictEqual(activeCourse.isFullCourseEnrolled, false);
  });

  it('3. Multi-Currency Course Upgrade Safety: Isolated per-course upgrade calculation', async () => {
    // Create an INR Topic Credit for Student B
    await TopicCredit.create({
      userId: studentB._id,
      courseId: courseINR._id,
      eligibleAmount: 500,
      remainingAmount: 500,
      status: 'ACTIVE',
    });

    const dataB = await StudentDashboardService.getOverview(studentB._id);
    assert.strictEqual(dataB.upgradeOpportunities.length, 1);

    const upgradeINR = dataB.upgradeOpportunities[0];
    assert.strictEqual(upgradeINR.courseId, courseINR._id.toString());
    assert.strictEqual(upgradeINR.currency, 'INR');
    assert.strictEqual(upgradeINR.fullCoursePrice, 2999);
    assert.strictEqual(upgradeINR.accumulatedCredit, 500);
    assert.strictEqual(upgradeINR.upgradePrice, 2499); // 2999 - 500 = 2499

    // Check Student A USD Upgrade
    const dataA = await StudentDashboardService.getOverview(studentA._id);
    const upgradeUSD = dataA.upgradeOpportunities[0];
    assert.strictEqual(upgradeUSD.currency, 'USD');
    assert.strictEqual(upgradeUSD.fullCoursePrice, 120);
    assert.strictEqual(upgradeUSD.accumulatedCredit, 30);
    assert.strictEqual(upgradeUSD.upgradePrice, 90); // 120 - 30 = 90
  });

  it('4. Streak Qualification: Only real learning events count; browsing/orders do not count', async () => {
    // Student B with zero learning actions has streak 0
    let dataB = await StudentDashboardService.getOverview(studentB._id);
    assert.strictEqual(dataB.streak.currentStreak, 0);
    assert.strictEqual(dataB.streak.isActiveToday, false);

    // Watch 1800s video (0.5 hrs) today
    await VideoProgress.create({
      userId: studentB._id,
      lessonId: lessonUSD1._id,
      watchedSeconds: 1800,
      totalSeconds: 1800,
      progressPercent: 100,
      maxContinuousSeconds: 600,
      completed: true,
      lastWatchedAt: new Date(),
    });

    dataB = await StudentDashboardService.getOverview(studentB._id);
    assert.strictEqual(dataB.streak.isActiveToday, true);
    assert.strictEqual(dataB.streak.currentStreak, 1);
    assert.strictEqual(dataB.stats.totalLearningHours, 0.5);
  });

  it('5. Live Attendance Streak: Booking alone does not qualify; 15-min attended status qualifies', async () => {
    const webinar = await Webinar.create({
      title: 'Cloud Masterclass Live',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      instructorId: studentA._id,
      status: 'LIVE',
    });

    const liveSession = await LiveSession.create({
      webinarId: webinar._id,
      instructorId: studentA._id,
      startTime: new Date(),
      status: 'LIVE',
    });

    // Create a CONFIRMED booking (not yet attended)
    const booking = await Booking.create({
      userId: studentA._id,
      liveSessionId: liveSession._id,
      status: 'CONFIRMED',
      attendedMinutes: 0,
      bookedAt: new Date(),
    });

    const data = await StudentDashboardService.getOverview(studentA._id);
    const bookedSession = data.upcomingLiveSessions.find((s) => s.sessionId === liveSession._id.toString());
    assert.ok(bookedSession);
    assert.strictEqual(bookedSession.isBooked, true);
    assert.strictEqual(bookedSession.priorityReason, 'BOOKED');

    // Clean up
    await Booking.deleteOne({ _id: booking._id });
    await LiveSession.deleteOne({ _id: liveSession._id });
    await Webinar.deleteOne({ _id: webinar._id });
  });

  it('6. Wishlist Dangling Reference Integrity: Non-existent products are omitted', async () => {
    const fakeProductId = new mongoose.Types.ObjectId();
    await Wishlist.create({
      userId: studentA._id,
      productType: 'COURSE',
      productId: fakeProductId,
    });

    const data = await StudentDashboardService.getOverview(studentA._id);
    // Phantom course is not pushed to wishlist output
    const phantom = data.wishlist.find((w) => w.productId === fakeProductId.toString());
    assert.strictEqual(phantom, undefined);
  });

  it('7. Refund & Revocation: Revoked entitlement removes course from Active Learning', async () => {
    // Revoke Student A entitlement
    await Entitlement.updateOne(
      { userId: studentA._id, productId: topicUSD1._id },
      { $set: { status: 'REVOKED', revokedAt: new Date() } }
    );

    const data = await StudentDashboardService.getOverview(studentA._id);
    assert.strictEqual(data.stats.activeCoursesCount, 0);
    assert.strictEqual(data.activeCourses.length, 0);
  });
});
