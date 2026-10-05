import { Router } from 'express';
import { CoursesController } from './courses.controller.js';
import { optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// Public / Semi-Authenticated Course Discovery Routes
router.get('/featured', optionalAuthenticate, CoursesController.getFeatured);
router.get('/topics', optionalAuthenticate, CoursesController.getTopics);
router.get('/', optionalAuthenticate, CoursesController.getCatalog);
router.get('/:slug', optionalAuthenticate, CoursesController.getDetails);

export const coursesRoutes = router;
