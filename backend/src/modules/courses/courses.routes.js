import { Router } from 'express';
import { CoursesController } from './courses.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// Public / Semi-Authenticated Course Discovery Routes
router.get('/featured', optionalAuthenticate, CoursesController.getFeatured);
router.get('/topics', optionalAuthenticate, CoursesController.getTopics);
router.get('/', optionalAuthenticate, CoursesController.getCatalog);
router.get('/:slug', optionalAuthenticate, CoursesController.getDetails);

// Classroom Interactive Routes
router.post('/:slug/progress', authenticate, CoursesController.updateProgress);
router.get('/:slug/review/my-review', authenticate, CoursesController.getMyReview);
router.post('/:slug/review', authenticate, CoursesController.submitReview);
router.get('/:slug/qa', optionalAuthenticate, CoursesController.getQuestions);
router.post('/:slug/qa', authenticate, CoursesController.askQuestion);
router.post('/:slug/qa/:questionId/answer', authenticate, CoursesController.answerQuestion);

export const coursesRoutes = router;
