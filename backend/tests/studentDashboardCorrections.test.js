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
  LearningProgress,
  VideoProgress,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Certificate,
} from '../src/models/index.js';
import { StudentDashboardService } from '../src/modules/studentDashboard/studentDashboard.service.js';
import { ROLES, USER_STATUS, PRODUCT_TYPES, ENTITLEMENT_STATUS } from '../src/config/constants.js';

describe('Final Student Dashboard Corrections Suite (Completion, Continuous Streak & Certificate Integrity)', () => {
  let testUser;
  let courseA;
  let topicA;
  let lessonA1;
  let lessonA2;
  let quizA;
  let assignmentA;

  let courseNoAssessments;
  let topicNoAssessments;
  let lessonNoAssessments;

  before(async () => {
    await connectDB();
    const ts = Date.now();

    // 1. Create Test Student
    testUser = await User.create({
      firstName: 'Correction',
      lastName: 'Student',
      email: `correction.student.${ts}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Course A (with Quiz and Assignment)
    courseA = await Course.create({
      title: 'Full Stack Masterclass',
      slug: `fs-masterclass-${ts}`,
      status: 'PUBLISHED',
      coursePrice: 100,
      currency: 'USD',
    });

    topicA = await Topic.create({
      title: 'Frontend Basics',
      slug: `frontend-basics-${ts}`,
      courseId: courseA._id,
      moduleId: new mongoose.Types.ObjectId(),
      status: 'PUBLISHED',
      price: 20,
    });

    lessonA1 = await Lesson.create({
      title: 'Lesson 1',
      topicId: topicA._id,
      moduleId: topicA.moduleId,
      courseId: courseA._id,
      status: 'PUBLISHED',
    });

    lessonA2 = await Lesson.create({
      title: 'Lesson 2',
      topicId: topicA._id,
      moduleId: topicA.moduleId,
      courseId: courseA._id,
      status: 'PUBLISHED',
    });

    // Create Quiz for Course A
    quizA = await Quiz.create({
      title: 'Full Stack Final Quiz',
      courseId: courseA._id,
      passingScore: 80,
      status: 'ACTIVE',
    });

    // Create Assignment for Course A
    assignmentA = await Assignment.create({
      title: 'Capstone Project Submission',
      courseId: courseA._id,
      status: 'ACTIVE',
    });

    // 3. Create Course Without Assessments
    courseNoAssessments = await Course.create({
      title: 'Reading Only Course',
      slug: `reading-only-${ts}`,
      status: 'PUBLISHED',
      coursePrice: 50,
      currency: 'USD',
    });

    topicNoAssessments = await Topic.create({
      title: 'Reading Topic',
      slug: `reading-topic-${ts}`,
      courseId: courseNoAssessments._id,
      moduleId: new mongoose.Types.ObjectId(),
      status: 'PUBLISHED',
      price: 25,
    });

    lessonNoAssessments = await Lesson.create({
      title: 'Reading Lesson 1',
      topicId: topicNoAssessments._id,
      moduleId: topicNoAssessments.moduleId,
      courseId: courseNoAssessments._id,
      status: 'PUBLISHED',
    });

    // Grant Full Course Entitlement to testUser for Course A and courseNoAssessments
    await Entitlement.create({
      userId: testUser._id,
      productType: PRODUCT_TYPES.COURSE,
      courseId: courseA._id,
      productId: courseA._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });

    await Entitlement.create({
      userId: testUser._id,
      productType: PRODUCT_TYPES.COURSE,
      courseId: courseNoAssessments._id,
      productId: courseNoAssessments._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });
  });

  after(async () => {
    await User.findByIdAndDelete(testUser?._id);
    await Course.deleteMany({ _id: { $in: [courseA?._id, courseNoAssessments?._id].filter(Boolean) } });
    await Topic.deleteMany({ _id: { $in: [topicA?._id, topicNoAssessments?._id].filter(Boolean) } });
    await Lesson.deleteMany({ _id: { $in: [lessonA1?._id, lessonA2?._id, lessonNoAssessments?._id].filter(Boolean) } });
    await Quiz.deleteMany({ _id: quizA?._id });
    await QuizAttempt.deleteMany({ userId: testUser?._id });
    await Assignment.deleteMany({ _id: assignmentA?._id });
    await AssignmentSubmission.deleteMany({ userId: testUser?._id });
    await LearningProgress.deleteMany({ userId: testUser?._id });
    await VideoProgress.deleteMany({ userId: testUser?._id });
    await Entitlement.deleteMany({ userId: testUser?._id });
    await Certificate.deleteMany({ userId: testUser?._id });
    await disconnectDB();
  });

  it('Fix 1.1: Content incomplete -> course is NOT completed', async () => {
    // Only lessonA1 completed, lessonA2 not completed
    await LearningProgress.create({
      userId: testUser._id,
      courseId: courseA._id,
      lessonId: lessonA1._id,
      completed: true,
      updatedAt: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(testUser._id);
    const activeCourse = dashboard.activeCourses.find((c) => c.courseId === courseA._id.toString());
    assert.ok(activeCourse, 'Course must remain in active courses when content is incomplete');
    assert.strictEqual(dashboard.stats.completedCoursesCount, 0);
  });

  it('Fix 1.2: Content complete + quiz failed -> course is NOT completed', async () => {
    // Complete lessonA2 as well
    await LearningProgress.create({
      userId: testUser._id,
      courseId: courseA._id,
      lessonId: lessonA2._id,
      completed: true,
      updatedAt: new Date(),
    });

    // Record a failed quiz attempt (score 50 < passingScore 80)
    await QuizAttempt.create({
      quizId: quizA._id,
      userId: testUser._id,
      score: 50,
      passed: false,
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(testUser._id);
    const activeCourse = dashboard.activeCourses.find((c) => c.courseId === courseA._id.toString());
    assert.ok(activeCourse, 'Course must remain in active courses when quiz is failed');
    assert.strictEqual(dashboard.stats.completedCoursesCount, 0);
  });

  it('Fix 1.3: Content complete + quiz passed + assignment missing -> course is NOT completed', async () => {
    // Record a passing quiz attempt (score 90 >= 80)
    await QuizAttempt.create({
      quizId: quizA._id,
      userId: testUser._id,
      score: 90,
      passed: true,
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    // Assignment is still not submitted
    const dashboard = await StudentDashboardService.getOverview(testUser._id);
    const activeCourse = dashboard.activeCourses.find((c) => c.courseId === courseA._id.toString());
    assert.ok(activeCourse, 'Course must remain in active courses when required assignment is missing');
    assert.strictEqual(dashboard.stats.completedCoursesCount, 0);
  });

  it('Fix 1.4: Content complete + quiz passed + assignment submitted -> course IS completed', async () => {
    // Submit assignment
    await AssignmentSubmission.create({
      assignmentId: assignmentA._id,
      userId: testUser._id,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(testUser._id);
    const activeCourse = dashboard.activeCourses.find((c) => c.courseId === courseA._id.toString());
    assert.strictEqual(activeCourse, undefined, 'Course must be removed from active courses upon full completion');
    assert.strictEqual(dashboard.stats.completedCoursesCount, 1, 'Completed courses count must increment to 1');
  });

  it('Fix 1.5: Course with no quizzes or assignments completes when content is completed', async () => {
    // Complete lessonNoAssessments
    await LearningProgress.create({
      userId: testUser._id,
      courseId: courseNoAssessments._id,
      lessonId: lessonNoAssessments._id,
      completed: true,
      updatedAt: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(testUser._id);
    const activeCourse = dashboard.activeCourses.find((c) => c.courseId === courseNoAssessments._id.toString());
    assert.strictEqual(activeCourse, undefined, 'Course without quizzes/assignments completes when content complete');
    assert.strictEqual(dashboard.stats.completedCoursesCount, 2, 'Total completed courses must be 2');
  });

  it('Fix 2.1: Segmented watch time with pauses (cumulative watchedSeconds >= 300, maxContinuousSeconds < 300) does NOT qualify streak', async () => {
    const streakUser = await User.create({
      firstName: 'Streak',
      lastName: 'Segmented',
      email: `streak.segmented.${Date.now()}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 1m + 2m + 2m = 300s cumulative, but maxContinuousSeconds = 120s (< 300) and progressPercent = 10% (< 20%)
    await VideoProgress.create({
      userId: streakUser._id,
      lessonId: new mongoose.Types.ObjectId(),
      watchedSeconds: 300,
      maxContinuousSeconds: 120,
      progressPercent: 10,
      lastWatchedAt: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(streakUser._id);
    assert.strictEqual(
      dashboard.streak.currentStreak,
      0,
      'Segmented watch time with maxContinuousSeconds < 300 must not qualify for streak'
    );
    assert.strictEqual(dashboard.streak.isActiveToday, false);

    await User.findByIdAndDelete(streakUser._id);
    await VideoProgress.deleteMany({ userId: streakUser._id });
  });

  it('Fix 2.2: Continuous watch time (maxContinuousSeconds >= 300) DOES qualify streak', async () => {
    const streakUser = await User.create({
      firstName: 'Streak',
      lastName: 'Continuous',
      email: `streak.continuous.${Date.now()}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // Continuous watch 320 seconds
    await VideoProgress.create({
      userId: streakUser._id,
      lessonId: new mongoose.Types.ObjectId(),
      watchedSeconds: 320,
      maxContinuousSeconds: 320,
      progressPercent: 15,
      lastWatchedAt: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(streakUser._id);
    assert.strictEqual(dashboard.streak.currentStreak, 1, 'maxContinuousSeconds >= 300 must qualify streak');
    assert.strictEqual(dashboard.streak.isActiveToday, true);

    await User.findByIdAndDelete(streakUser._id);
    await VideoProgress.deleteMany({ userId: streakUser._id });
  });

  it('Fix 3: Certificate referencing a missing/deleted course returns courseTitle: null without fabricated title', async () => {
    const deletedCourseId = new mongoose.Types.ObjectId();
    const certNumber = `CERT-DEL-${Date.now()}`;

    await Certificate.create({
      userId: testUser._id,
      courseId: deletedCourseId, // course does not exist in courses collection
      certificateNumber: certNumber,
      verificationUrl: `/verify/${certNumber}`,
      status: 'ISSUED',
      issueDate: new Date(),
    });

    const dashboard = await StudentDashboardService.getOverview(testUser._id);
    const cert = dashboard.recentCertificates.find((c) => c.certificateNumber === certNumber);
    assert.ok(cert, 'Certificate must exist in recentCertificates');
    assert.strictEqual(
      cert.courseTitle,
      null,
      'When referenced course cannot be resolved, courseTitle must be null, never "Certified Course"'
    );
  });
});
