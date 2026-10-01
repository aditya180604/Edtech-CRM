import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import http from 'http';
import app from '../src/app.js';
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
  QuizAttempt,
  AssignmentSubmission,
} from '../src/models/index.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { ROLES, USER_STATUS, PRODUCT_TYPES, ENTITLEMENT_STATUS, ORDER_STATUS, PAYMENT_STATUS } from '../src/config/constants.js';

describe('Phase 6 — Student Dashboard End-to-End HTTP & Persistence Suite', () => {
  let server;
  let baseUrl;
  let studentUser;
  let instructorUser;
  let adminUser;

  let studentTokens;
  let instructorTokens;
  let adminTokens;

  let testCourse;
  let testModule;
  let testTopic;
  let testLesson;

  before(async () => {
    await connectDB();

    // 1. Start test HTTP server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    // 2. Create Student User
    const studentPasswordHash = await User.hashPassword('Student123!');
    studentUser = await User.create({
      firstName: 'E2E',
      lastName: 'Student',
      email: `e2e_student_${Date.now()}@example.com`,
      passwordHash: studentPasswordHash,
      phone: '+18889990000',
      profilePhoto: 'https://images.unsplash.com/photo-e2e',
      country: 'Canada',
      timezone: 'America/Toronto',
      preferredLanguage: 'en',
      learningPreferences: { focus: 'Fullstack' },
      skills: ['React', 'Node.js'],
      interests: ['Web', 'Cloud'],
      qualification: 'B.S.',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    // 3. Create Instructor User
    const instructorPasswordHash = await User.hashPassword('Instructor123!');
    instructorUser = await User.create({
      firstName: 'E2E',
      lastName: 'Instructor',
      email: `e2e_instructor_${Date.now()}@example.com`,
      passwordHash: instructorPasswordHash,
      role: ROLES.INSTRUCTOR,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    // 4. Create Admin User
    const adminPasswordHash = await User.hashPassword('Admin123!');
    adminUser = await User.create({
      firstName: 'E2E',
      lastName: 'Admin',
      email: `e2e_admin_${Date.now()}@example.com`,
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
    });

    // 5. Generate Auth Tokens
    studentTokens = await AuthService.login({
      email: studentUser.email,
      password: 'Student123!',
    });

    instructorTokens = await AuthService.login({
      email: instructorUser.email,
      password: 'Instructor123!',
    });

    adminTokens = await AuthService.login({
      email: adminUser.email,
      password: 'Admin123!',
    });

    // 6. Create Course, Module, Topic, Lesson in DB
    testCourse = await Course.create({
      title: 'Full-Stack Distributed Systems',
      slug: `distributed-systems-${Date.now()}`,
      description: 'Mastering distributed databases and messaging',
      coursePrice: 150,
      currency: 'USD',
      status: 'PUBLISHED',
      category: 'Cloud',
    });

    testModule = await Module.create({
      courseId: testCourse._id,
      title: 'Module 1: Messaging',
      order: 1,
    });

    testTopic = await Topic.create({
      moduleId: testModule._id,
      courseId: testCourse._id,
      title: 'Topic 1: Kafka & RabbitMQ',
      price: 50,
      currency: 'USD',
      order: 1,
    });

    testLesson = await Lesson.create({
      topicId: testTopic._id,
      title: 'Lesson 1: Kafka Producers',
      order: 1,
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (studentUser) await User.deleteOne({ _id: studentUser._id });
    if (instructorUser) await User.deleteOne({ _id: instructorUser._id });
    if (adminUser) await User.deleteOne({ _id: adminUser._id });
    if (testCourse) await Course.deleteOne({ _id: testCourse._id });
    if (testModule) await Module.deleteOne({ _id: testModule._id });
    if (testTopic) await Topic.deleteOne({ _id: testTopic._id });
    if (testLesson) await Lesson.deleteOne({ _id: testLesson._id });

    if (studentUser) {
      await Entitlement.deleteMany({ userId: studentUser._id });
      await TopicCredit.deleteMany({ userId: studentUser._id });
      await LearningProgress.deleteMany({ userId: studentUser._id });
      await VideoProgress.deleteMany({ userId: studentUser._id });
      await Certificate.deleteMany({ userId: studentUser._id });
      await Wishlist.deleteMany({ userId: studentUser._id });
      await Order.deleteMany({ userId: studentUser._id });
      await Notification.deleteMany({ userId: studentUser._id });
      await Booking.deleteMany({ userId: studentUser._id });
      await Recommendation.deleteMany({ userId: studentUser._id });
    }

    await disconnectDB();
  });

  it('1. HTTP GET /api/v1/dashboard/student returns 401 when no token is provided', async () => {
    const res = await fetch(`${baseUrl}/dashboard/student`);
    assert.strictEqual(res.status, 401);
  });

  it('2. HTTP GET /api/v1/dashboard/student returns 403 when authenticated as INSTRUCTOR or ADMIN', async () => {
    const instRes = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${instructorTokens.accessToken}` },
    });
    assert.strictEqual(instRes.status, 403);

    const adminRes = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
    });
    assert.strictEqual(adminRes.status, 403);
  });

  it('3. HTTP GET /api/v1/dashboard/student returns 200 with live DB state for authenticated STUDENT', async () => {
    const res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.profile.email, studentUser.email);
    assert.strictEqual(json.data.profile.completionPercentage, 100);
    assert.strictEqual(json.data.stats.activeCoursesCount, 0);
  });

  it('4. Attempting query param tampering (?userId=...) has zero effect on authenticated scope', async () => {
    const fakeOtherUserId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${baseUrl}/dashboard/student?userId=${fakeOtherUserId}`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    // Scope must strictly be studentUser._id, not the query param
    assert.strictEqual(json.data.profile.userId, studentUser._id.toString());
  });

  it('5. Profile Mutation & Persistence: Updating profile via API recalculates dashboard profile completion', async () => {
    // Partially clear profile field via PATCH /users/me
    const updateRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentTokens.accessToken}`,
      },
      body: JSON.stringify({
        phone: '', // clearing phone should deduct 10%
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    // Fetch dashboard again
    const dashRes = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    const dashJson = await dashRes.json();
    assert.strictEqual(dashJson.data.profile.completionPercentage, 90);
    assert.ok(dashJson.data.profile.missingFields.includes('phone'));

    // Restore phone
    await fetch(`${baseUrl}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentTokens.accessToken}`,
      },
      body: JSON.stringify({ phone: '+18889990000' }),
    });
  });

  it('6. Entitlement Mutation & Refetch: Topic purchase reflects active course and upgrade opportunity', async () => {
    // Create topic entitlement in MongoDB
    await Entitlement.create({
      userId: studentUser._id,
      productType: PRODUCT_TYPES.TOPIC,
      productId: testTopic._id,
      courseId: testCourse._id,
      topicId: testTopic._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    // Create topic credit in MongoDB
    await TopicCredit.create({
      userId: studentUser._id,
      courseId: testCourse._id,
      eligibleAmount: 50,
      remainingAmount: 50,
      status: 'ACTIVE',
    });

    // Refetch dashboard
    const res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    const json = await res.json();

    assert.strictEqual(json.data.stats.activeCoursesCount, 1);
    assert.strictEqual(json.data.stats.purchasedTopicsCount, 1);
    assert.strictEqual(json.data.activeCourses.length, 1);
    assert.strictEqual(json.data.activeCourses[0].courseId, testCourse._id.toString());
    assert.strictEqual(json.data.activeCourses[0].isFullCourseEnrolled, false);

    assert.strictEqual(json.data.upgradeOpportunities.length, 1);
    const upgrade = json.data.upgradeOpportunities[0];
    assert.strictEqual(upgrade.courseId, testCourse._id.toString());
    assert.strictEqual(upgrade.fullCoursePrice, 150);
    assert.strictEqual(upgrade.accumulatedCredit, 50);
    assert.strictEqual(upgrade.upgradePrice, 100); // 150 - 50 = 100
  });

  it('7. Video Progress Mutation & Refetch: Watching video updates learning hours and daily streak', async () => {
    // Record VideoProgress
    await VideoProgress.create({
      userId: studentUser._id,
      lessonId: testLesson._id,
      watchedSeconds: 3600, // 1 hour
      totalSeconds: 3600,
      progressPercent: 100,
      maxContinuousSeconds: 600,
      completed: true,
      lastWatchedAt: new Date(),
    });

    // Mark LearningProgress
    await LearningProgress.create({
      userId: studentUser._id,
      topicId: testTopic._id,
      lessonId: testLesson._id,
      completed: true,
      lastWatchedAt: new Date(),
    });

    const res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    const json = await res.json();

    assert.strictEqual(json.data.stats.totalLearningHours, 1.0);
    assert.strictEqual(json.data.activeCourses[0].entitledProgressPercentage, 100);
    assert.strictEqual(json.data.streak.isActiveToday, true);
    assert.strictEqual(json.data.streak.currentStreak, 1);
  });

  it('8. Wishlist Mutation & Refetch: Adding and removing wishlist persists accurately', async () => {
    const wishItem = await Wishlist.create({
      userId: studentUser._id,
      productType: 'COURSE',
      productId: testCourse._id,
    });

    let res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    let json = await res.json();
    assert.strictEqual(json.data.wishlist.length, 1);
    assert.strictEqual(json.data.wishlist[0].productId, testCourse._id.toString());

    // Remove wishlist item
    await Wishlist.deleteOne({ _id: wishItem._id });

    res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    json = await res.json();
    assert.strictEqual(json.data.wishlist.length, 0);
  });

  it('9. Notification Read State Mutation & Refetch: Read status updates unread count', async () => {
    const notif = await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      userId: studentUser._id,
      type: 'CERTIFICATE_ISSUED',
      title: 'Congratulations!',
      message: 'Certificate is now available',
      isRead: false,
    });

    let res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    let json = await res.json();
    assert.strictEqual(json.data.notifications.unreadCount, 1);

    // Mark notification as read
    await Notification.updateOne({ _id: notif._id }, { $set: { isRead: true, readAt: new Date() } });

    res = await fetch(`${baseUrl}/dashboard/student`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    json = await res.json();
    assert.strictEqual(json.data.notifications.unreadCount, 0);
  });
});
