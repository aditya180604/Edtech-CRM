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
} from '../src/models/index.js';
import { StudentDashboardService } from '../src/modules/studentDashboard/studentDashboard.service.js';
import { ROLES, USER_STATUS, PRODUCT_TYPES, ENTITLEMENT_STATUS } from '../src/config/constants.js';

describe('Student Dashboard Service & API Verification Suite', () => {
  let testStudentUser;
  let testCourse;
  let testModule;
  let testTopics = [];
  let testLessons = [];

  before(async () => {
    await connectDB();

    // 1. Create a clean test student
    testStudentUser = await User.create({
      firstName: 'Alice',
      lastName: 'Smith',
      email: `alice.student.${Date.now()}@test.com`,
      phone: '+1234567890',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      country: 'USA',
      timezone: 'America/New_York',
      preferredLanguage: 'en',
      learningPreferences: { pace: 'self-paced', topicInterest: 'frontend' },
      skills: ['HTML', 'CSS', 'JavaScript'],
      interests: ['React', 'Web Development'],
      qualification: 'B.Tech Computer Science',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create a test Course with 2 Topics and 4 Lessons
    testCourse = await Course.create({
      title: 'Fullstack Mastery Test Course',
      slug: `fullstack-mastery-${Date.now()}`,
      description: 'Comprehensive test fullstack course',
      coursePrice: 100,
      currency: 'USD',
      status: 'PUBLISHED',
      category: 'Web Development',
    });

    testModule = await Module.create({
      courseId: testCourse._id,
      title: 'Module 1: Foundations',
      order: 1,
    });

    // 2 Topics
    const topic1 = await Topic.create({
      moduleId: testModule._id,
      courseId: testCourse._id,
      title: 'Topic 1: React Basics',
      price: 25,
      currency: 'USD',
      order: 1,
    });
    const topic2 = await Topic.create({
      moduleId: testModule._id,
      courseId: testCourse._id,
      title: 'Topic 2: State Management',
      price: 25,
      currency: 'USD',
      order: 2,
    });
    testTopics = [topic1, topic2];

    // 4 Lessons (2 per topic)
    const l1 = await Lesson.create({
      courseId: testCourse._id,
      moduleId: testModule._id,
      topicId: topic1._id,
      title: 'Lesson 1.1 Intro',
      order: 1,
    });
    const l2 = await Lesson.create({
      courseId: testCourse._id,
      moduleId: testModule._id,
      topicId: topic1._id,
      title: 'Lesson 1.2 Components',
      order: 2,
    });
    const l3 = await Lesson.create({
      courseId: testCourse._id,
      moduleId: testModule._id,
      topicId: topic2._id,
      title: 'Lesson 2.1 Hooks',
      order: 3,
    });
    const l4 = await Lesson.create({
      courseId: testCourse._id,
      moduleId: testModule._id,
      topicId: topic2._id,
      title: 'Lesson 2.2 Context',
      order: 4,
    });
    testLessons = [l1, l2, l3, l4];
  });

  after(async () => {
    // Cleanup created test data
    if (testStudentUser) await User.deleteOne({ _id: testStudentUser._id });
    if (testCourse) await Course.deleteOne({ _id: testCourse._id });
    if (testModule) await Module.deleteOne({ _id: testModule._id });
    for (const t of testTopics) await Topic.deleteOne({ _id: t._id });
    for (const l of testLessons) await Lesson.deleteOne({ _id: l._id });
    if (testStudentUser) {
      await Entitlement.deleteMany({ userId: testStudentUser._id });
      await TopicCredit.deleteMany({ userId: testStudentUser._id });
      await LearningProgress.deleteMany({ userId: testStudentUser._id });
      await VideoProgress.deleteMany({ userId: testStudentUser._id });
      await Notification.deleteMany({ userId: testStudentUser._id });
    }
    await disconnectDB();
  });

  it('1. Fresh student with full profile fields achieves 100% profile completion', async () => {
    const data = await StudentDashboardService.getOverview(testStudentUser._id);
    assert.strictEqual(data.profile.completionPercentage, 100);
    assert.strictEqual(data.profile.missingFields.length, 0);
    assert.strictEqual(data.stats.activeCoursesCount, 0);
    assert.strictEqual(data.stats.purchasedTopicsCount, 0);
    assert.strictEqual(data.stats.completedCoursesCount, 0);
    assert.strictEqual(data.stats.totalLearningHours, 0);
    assert.strictEqual(data.activeCourses.length, 0);
    assert.strictEqual(data.upgradeOpportunities.length, 0);
  });

  it('2. Partial profile correctly penalizes missing fields and reports missing list', async () => {
    const partialUser = await User.create({
      firstName: 'Bob',
      email: `bob.${Date.now()}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    const data = await StudentDashboardService.getOverview(partialUser._id);
    // Missing: lastName (0% for identity), phone (0% contact), photo (0%), location (0%), pref (0%), skills (0%), interests (0%), edu (0%)
    assert.strictEqual(data.profile.completionPercentage, 0);
    assert.ok(data.profile.missingFields.includes('lastName'));
    assert.ok(data.profile.missingFields.includes('phone'));
    assert.ok(data.profile.missingFields.includes('profilePhoto'));

    await User.deleteOne({ _id: partialUser._id });
  });

  it('3. Topic entitlement creates active course with correct purchased vs total topic fractions', async () => {
    // Grant student Topic 1 only (which has 2 lessons out of course total 4)
    await Entitlement.create({
      userId: testStudentUser._id,
      productType: PRODUCT_TYPES.TOPIC,
      productId: testTopics[0]._id,
      courseId: testCourse._id,
      topicId: testTopics[0]._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    // Create Topic Credit for this purchase
    await TopicCredit.create({
      userId: testStudentUser._id,
      courseId: testCourse._id,
      eligibleAmount: 25,
      remainingAmount: 25,
      status: 'ACTIVE',
    });

    const data = await StudentDashboardService.getOverview(testStudentUser._id);

    assert.strictEqual(data.stats.activeCoursesCount, 1);
    assert.strictEqual(data.stats.purchasedTopicsCount, 1);
    assert.strictEqual(data.activeCourses.length, 1);

    const activeCourse = data.activeCourses[0];
    assert.strictEqual(activeCourse.courseId, testCourse._id.toString());
    assert.strictEqual(activeCourse.enrolledTopicsCount, 1);
    assert.strictEqual(activeCourse.totalCourseTopicsCount, 2);
    assert.strictEqual(activeCourse.isFullCourseEnrolled, false);
    assert.strictEqual(activeCourse.entitledProgressPercentage, 0); // 0 of 2 entitled lessons completed

    // Check Upgrade Opportunity
    assert.strictEqual(data.upgradeOpportunities.length, 1);
    const upgrade = data.upgradeOpportunities[0];
    assert.strictEqual(upgrade.courseId, testCourse._id.toString());
    assert.strictEqual(upgrade.fullCoursePrice, 100);
    assert.strictEqual(upgrade.accumulatedCredit, 25);
    assert.strictEqual(upgrade.upgradePrice, 75); // 100 - 25 = 75
    assert.strictEqual(upgrade.currency, 'USD');
  });

  it('4. Completing 1 entitled lesson calculates 50% entitled progress (1 of 2 owned lessons)', async () => {
    // Mark Lesson 1.1 completed
    await LearningProgress.create({
      userId: testStudentUser._id,
      courseId: testCourse._id,
      topicId: testTopics[0]._id,
      lessonId: testLessons[0]._id,
      completed: true,
      lastWatchedAt: new Date(),
    });

    // Log 1800s video watched (0.5 hrs)
    await VideoProgress.create({
      userId: testStudentUser._id,
      lessonId: testLessons[0]._id,
      watchedSeconds: 1800,
      totalSeconds: 1800,
      progressPercent: 100,
      completed: true,
      lastWatchedAt: new Date(),
    });

    const data = await StudentDashboardService.getOverview(testStudentUser._id);
    const activeCourse = data.activeCourses[0];

    assert.strictEqual(activeCourse.entitledProgressPercentage, 50); // 1 of 2 lessons in Topic 1 = 50%
    assert.strictEqual(data.stats.totalLearningHours, 0.5);
    assert.strictEqual(data.streak.isActiveToday, true);
    assert.strictEqual(data.streak.currentStreak, 1);
  });
});
