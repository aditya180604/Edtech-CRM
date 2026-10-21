import { Router } from 'express';
import { CoursesController } from './courses.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { publicCache } from '../../middleware/httpCache.js';

const router = Router();

// Public / Semi-Authenticated Course Discovery Routes
router.get('/featured', publicCache(), optionalAuthenticate, CoursesController.getFeatured);
router.get('/topics', publicCache(), optionalAuthenticate, CoursesController.getTopics);
router.get('/', publicCache(), optionalAuthenticate, CoursesController.getCatalog);
router.get('/:slug', publicCache(), optionalAuthenticate, CoursesController.getDetails);

// Classroom Interactive Routes
router.post('/:slug/progress', authenticate, CoursesController.updateProgress);
router.get('/:slug/reviews', optionalAuthenticate, CoursesController.getCourseReviews);
router.get('/:slug/review/my-review', authenticate, CoursesController.getMyReview);
router.post('/:slug/review', authenticate, CoursesController.submitReview);
router.post('/reviews/:reviewId/vote', authenticate, CoursesController.voteHelpfulReview);
router.post('/reviews/:reviewId/flag', authenticate, CoursesController.flagReview);
router.get('/:slug/qa', optionalAuthenticate, CoursesController.getQuestions);
router.post('/:slug/qa', authenticate, CoursesController.askQuestion);
router.post('/:slug/qa/:questionId/answer', authenticate, CoursesController.answerQuestion);

export const coursesRoutes = router;
