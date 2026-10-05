import { Router } from 'express';
import { LearningPathController } from './learningPath.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// ============================================================
// LEARNING PATH ROUTES
// ============================================================
// Public list of learning paths
router.get('/learning-paths', optionalAuthenticate, LearningPathController.getLearningPaths);

// Public/student dynamic roadmap (Path -> Domains -> Topics)
router.get('/learning-paths/:slugOrId', optionalAuthenticate, LearningPathController.getLearningPathBySlug);

// Authenticated student enrollment in a Learning Path
router.post('/learning-paths/:slugOrId/enroll', authenticate, LearningPathController.enrollLearningPath);

// ============================================================
// TOPIC & TUTOR OFFERINGS MARKETPLACE ROUTES
// ============================================================
// Canonical topic detail + list of published tutor offerings
router.get('/topics/:topicId', optionalAuthenticate, LearningPathController.getTopicDetail);

// ============================================================
// OFFERING DETAIL, PURCHASE & LESSON PLAYBACK ROUTES
// ============================================================
// Tutor offering detail + curriculum
router.get('/offerings/:offeringId', optionalAuthenticate, LearningPathController.getOfferingDetail);

// Strictly entitlement-gated lesson stream/content
router.get(
  '/offerings/:offeringId/lessons/:lessonId/content',
  authenticate,
  LearningPathController.getOfferingLessonContent
);

// Authoritative checkout/purchase of specific tutor offering
router.post(
  '/checkout/offering/:offeringId',
  authenticate,
  LearningPathController.purchaseOffering
);

// Progress tracking for an offering lesson
router.post(
  '/offerings/:offeringId/progress',
  authenticate,
  LearningPathController.updateOfferingProgress
);

export const learningPathRoutes = router;
