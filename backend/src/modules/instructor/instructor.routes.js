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

// 3. Curriculum Hierarchy (Modules -> Topics -> Lessons)
router.post('/courses/:id/modules', InstructorController.addModule);
router.post('/modules/:moduleId/topics', InstructorController.addTopic);
router.post('/topics/:topicId/lessons', InstructorController.addLesson);

// 4. Webinars
router.get('/webinars', InstructorController.getWebinars);
router.post('/webinars', InstructorController.createWebinar);

// 5. Enrolled Students
router.get('/students', InstructorController.getStudents);

// 6. Q&A Community Questions
router.get('/questions', InstructorController.getQuestions);
router.post('/questions/:questionId/answer', InstructorController.answerQuestion);

// 7. Profile & 4-Tier Verification
router.get('/profile', InstructorController.getProfile);
router.put('/profile', InstructorController.updateProfile);

export const instructorRoutes = router;
