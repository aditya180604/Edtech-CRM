import { Router } from 'express';
import { CatalogController } from './catalog.controller.js';
import { publicCache } from '../../middleware/httpCache.js';

const router = Router();

// Courses
router.get('/courses', CatalogController.getCourses);
router.get('/courses/:slugOrId', CatalogController.getCourseBySlug);

// Topics
router.get('/topics', publicCache(), CatalogController.getTopics);

// Webinars / Live Workshops
router.get('/webinars', CatalogController.getWebinars);
router.get('/webinars/room/:roomCode', CatalogController.getWebinarRoom);

// Instructors
router.get('/instructors', publicCache(), CatalogController.getInstructors);

// Learning Paths
router.get('/learning-paths', CatalogController.getLearningPaths);

// Categories
router.get('/categories', publicCache(60), CatalogController.getCategories);

// Stats
router.get('/stats', publicCache(60), CatalogController.getPublicStats);

export const catalogRoutes = router;
