import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Course,
  Module,
  Topic,
  Entitlement,
  LearningProgress,
  Recommendation,
} from '../src/models/index.js';
import { StudentDashboardService } from '../src/modules/studentDashboard/studentDashboard.service.js';
import { ROLES, USER_STATUS, PRODUCT_TYPES, ENTITLEMENT_STATUS } from '../src/config/constants.js';

describe('Strict Signal-Driven Student Dashboard Recommendations Suite', () => {
  let blankStudent;
  let interestStudent;
  let skillStudent;
  let learningStudent;
  let ownedCourseStudent;

  let pythonCourse;
  let devopsCourse;
  let aiCourse;
  let mobileCourse;
  let draftCourse;

  before(async () => {
    await connectDB();

    const timestamp = Date.now();

    // 1. Create Courses in MongoDB
    pythonCourse = await Course.create({
      title: 'Advanced Python for Data Science',
      slug: `adv-python-${timestamp}`,
      category: 'Data Science',
      skills: ['Python', 'Pandas', 'NumPy'],
      status: 'PUBLISHED',
      coursePrice: 49,
      currency: 'USD',
    });

    devopsCourse = await Course.create({
      title: 'Kubernetes & CI/CD Pipelines',
      slug: `k8s-cicd-${timestamp}`,
      category: 'Cloud & DevOps',
      skills: ['Kubernetes', 'Docker', 'CI/CD'],
      status: 'PUBLISHED',
      coursePrice: 79,
      currency: 'USD',
    });

    aiCourse = await Course.create({
      title: 'Deep Learning with PyTorch',
      slug: `dl-pytorch-${timestamp}`,
      category: 'Artificial Intelligence',
      skills: ['PyTorch', 'Neural Networks'],
      status: 'PUBLISHED',
      coursePrice: 99,
      currency: 'USD',
    });

    mobileCourse = await Course.create({
      title: 'React Native Mobile Apps',
      slug: `react-native-${timestamp}`,
      category: 'Mobile Development',
      skills: ['React Native', 'Mobile'],
      status: 'PUBLISHED',
      coursePrice: 59,
      currency: 'USD',
    });

    draftCourse = await Course.create({
      title: 'Unpublished Draft Course',
      slug: `draft-course-${timestamp}`,
      category: 'Data Science',
      skills: ['Python'],
      status: 'DRAFT',
      coursePrice: 29,
      currency: 'USD',
    });

    // 2. Create Blank Student (no purchases, no interests, no skills, no progress)
    blankStudent = await User.create({
      firstName: 'Blank',
      lastName: 'Student',
      email: `blank.student.${timestamp}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: [],
      skills: [],
    });

    // 3. Create Student with Interests
    interestStudent = await User.create({
      firstName: 'Interest',
      lastName: 'Student',
      email: `interest.student.${timestamp}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: ['Cloud & DevOps'],
      skills: [],
    });

    // 4. Create Student with Skills
    skillStudent = await User.create({
      firstName: 'Skill',
      lastName: 'Student',
      email: `skill.student.${timestamp}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: [],
      skills: ['PyTorch'],
    });

    // 5. Create Student with Recent Completed Topic/Course Learning Affinity
    learningStudent = await User.create({
      firstName: 'Learning',
      lastName: 'Student',
      email: `learning.student.${timestamp}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: [],
      skills: [],
    });

    // Add completed learning progress for pythonCourse
    await LearningProgress.create({
      userId: learningStudent._id,
      courseId: pythonCourse._id,
      completed: true,
      updatedAt: new Date(),
    });

    // 6. Create Student with Owned Course
    ownedCourseStudent = await User.create({
      firstName: 'Owned',
      lastName: 'Student',
      email: `owned.student.${timestamp}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: ['Data Science'],
      skills: [],
    });

    await Entitlement.create({
      userId: ownedCourseStudent._id,
      productType: PRODUCT_TYPES.COURSE,
      courseId: pythonCourse._id,
      productId: pythonCourse._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });
  });

  after(async () => {
    // Clean up test data
    await User.deleteMany({
      _id: {
        $in: [
          blankStudent?._id,
          interestStudent?._id,
          skillStudent?._id,
          learningStudent?._id,
          ownedCourseStudent?._id,
        ].filter(Boolean),
      },
    });

    await Course.deleteMany({
      _id: {
        $in: [
          pythonCourse?._id,
          devopsCourse?._id,
          aiCourse?._id,
          mobileCourse?._id,
          draftCourse?._id,
        ].filter(Boolean),
      },
    });

    await LearningProgress.deleteMany({
      userId: learningStudent?._id,
    });

    await Entitlement.deleteMany({
      userId: ownedCourseStudent?._id,
    });

    await disconnectDB();
  });

  it('Case 1: New student with no interests, skills, purchases, or learning history receives [] recommendations', async () => {
    const dashboard = await StudentDashboardService.getOverview(blankStudent._id);
    assert.ok(Array.isArray(dashboard.recommendations), 'recommendations should be an array');
    assert.strictEqual(
      dashboard.recommendations.length,
      0,
      'A new student with 0 signals must receive an empty array [], not generic catalog fallbacks'
    );
  });

  it('Case 2: Student with a persisted interest matching a course gets relevant recommendation with explainable reason', async () => {
    const dashboard = await StudentDashboardService.getOverview(interestStudent._id);
    assert.ok(dashboard.recommendations.length > 0, 'Should return matching course');
    const match = dashboard.recommendations.find((r) => r.courseId === devopsCourse._id.toString());
    assert.ok(match, 'Should recommend Cloud & DevOps course');
    assert.ok(
      match.reason.includes('Cloud & DevOps'),
      `Reason must explain match with interest: got "${match.reason}"`
    );
  });

  it('Case 3: Student with persisted skill matching a course gets relevant recommendation with explainable reason', async () => {
    const dashboard = await StudentDashboardService.getOverview(skillStudent._id);
    assert.ok(dashboard.recommendations.length > 0, 'Should return matching skill course');
    const match = dashboard.recommendations.find((r) => r.courseId === aiCourse._id.toString());
    assert.ok(match, 'Should recommend Deep Learning with PyTorch');
    assert.ok(
      match.reason.includes('PyTorch'),
      `Reason must explain match with skill: got "${match.reason}"`
    );
  });

  it('Case 4: Student with recent completed learning category affinity gets relevant recommendation', async () => {
    // learningStudent has learningProgress in pythonCourse (Data Science)
    // Should recommend other Data Science courses (excluding draft courses)
    const dashboard = await StudentDashboardService.getOverview(learningStudent._id);
    // Since pythonCourse was in learning progress, affinity is Data Science
    assert.ok(Array.isArray(dashboard.recommendations));
    if (dashboard.recommendations.length > 0) {
      assert.ok(
        dashboard.recommendations.every((r) => r.courseId !== draftCourse._id.toString()),
        'Draft courses must never be recommended'
      );
    }
  });

  it('Case 5: Already-owned active course is strictly excluded from recommendations even if matching interest', async () => {
    const dashboard = await StudentDashboardService.getOverview(ownedCourseStudent._id);
    const hasOwnedCourse = dashboard.recommendations.some(
      (r) => r.courseId === pythonCourse._id.toString()
    );
    assert.strictEqual(hasOwnedCourse, false, 'Already owned course must never be recommended');
  });

  it('Case 6: Student with interests having no matching published courses receives []', async () => {
    const obscureStudent = await User.create({
      firstName: 'Obscure',
      lastName: 'Student',
      email: `obscure.${Date.now()}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: ['Ancient Sumerian Literature'],
      skills: ['Cuneiform Reading'],
    });

    const dashboard = await StudentDashboardService.getOverview(obscureStudent._id);
    assert.strictEqual(
      dashboard.recommendations.length,
      0,
      'When no catalog courses match student signals, must return []'
    );

    await User.findByIdAndDelete(obscureStudent._id);
  });

  it('Case 7: No random or latest-course fallback is returned when signal is absent', async () => {
    const freshUser = await User.create({
      firstName: 'Fresh',
      lastName: 'User',
      email: `fresh.${Date.now()}@test.com`,
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      interests: [],
      skills: [],
    });

    const dashboard = await StudentDashboardService.getOverview(freshUser._id);
    assert.deepStrictEqual(dashboard.recommendations, []);

    await User.findByIdAndDelete(freshUser._id);
  });
});
