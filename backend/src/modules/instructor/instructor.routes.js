import { Router } from 'express';
import { InstructorController } from './instructor.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

// Secure Instructor Routes Barrier
router.use(authenticate);
router.use(authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN));

// 1. Dashboard & Telemetry
router.get('/dashboard', InstructorController.getDashboard);

// 2. Course Management & 5-Step Builder
router.get('/courses', InstructorController.getCourses);
router.post('/courses', InstructorController.createCourse);
router.get('/courses/:id', InstructorController.getCourseById);
router.put('/courses/:id', InstructorController.updateCourse);
router.delete('/courses/:id', InstructorController.deleteCourse);
router.patch('/courses/:id/price', InstructorController.updatePrice);
router.patch('/courses/:id/visibility', InstructorController.updateVisibility);
router.post('/courses/:id/submit-for-review', InstructorController.submitForReview);
router.post('/courses/:id/publishing-fee/create-order', InstructorController.createPublishingFeeOrder);
router.post('/courses/:id/publishing-fee/verify', InstructorController.verifyPublishingFee);
router.get('/courses/:id/publishing-fee/status', InstructorController.getPublishingFeeStatus);
router.post('/courses/:id/publish', InstructorController.publishCourse);

// 3. Curriculum Hierarchy (Modules -> Topics -> Lessons)
router.post('/courses/:id/modules', InstructorController.addModule);
router.post('/modules/:moduleId/topics', InstructorController.addTopic);
router.post('/topics/:topicId/lessons', InstructorController.addLesson);

// 4. Webinars
router.get('/webinars', InstructorController.getWebinars);
router.post('/webinars', InstructorController.createWebinar);
router.put('/webinars/:id', InstructorController.updateWebinar);
router.delete('/webinars/:id', InstructorController.deleteWebinar);
router.patch('/webinars/:id/status', InstructorController.updateWebinarStatus);

// 5. Enrolled Students
router.get('/students', InstructorController.getStudents);

// 6. Reviews & Ratings
router.get('/reviews', InstructorController.getReviews);

// 7. Q&A Community Questions
router.get('/questions', InstructorController.getQuestions);
router.post('/questions/:questionId/answer', InstructorController.answerQuestion);

// 8. Analytics
router.get('/analytics', InstructorController.getAnalytics);

// 9. Profile & 4-Tier Verification & Onboarding
router.get('/profile', InstructorController.getProfile);
router.put('/profile', InstructorController.updateProfile);
router.post('/profile/onboarding', InstructorController.completeOnboarding);

export const instructorRoutes = router;
