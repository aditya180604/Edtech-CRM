import { Router } from 'express';
import { CatalogController } from './catalog.controller.js';

const router = Router();

// Courses
router.get('/courses', CatalogController.getCourses);
router.get('/courses/:slugOrId', CatalogController.getCourseBySlug);

// Topics
router.get('/topics', CatalogController.getTopics);

// Webinars / Live Workshops
router.get('/webinars', CatalogController.getWebinars);

// Instructors
router.get('/instructors', CatalogController.getInstructors);

// Learning Paths
router.get('/learning-paths', CatalogController.getLearningPaths);

// Categories
router.get('/categories', CatalogController.getCategories);

// Stats
router.get('/stats', CatalogController.getPublicStats);

export const catalogRoutes = router;
