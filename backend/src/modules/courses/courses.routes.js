import { Router } from 'express';
import { CoursesController } from './courses.controller.js';

const router = Router();

// Public Course Discovery Routes
router.get('/featured', CoursesController.getFeatured);
router.get('/', CoursesController.getCatalog);
router.get('/:slug', CoursesController.getDetails);

export const coursesRoutes = router;
