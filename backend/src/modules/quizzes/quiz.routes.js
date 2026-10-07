import { Router } from 'express';
import { QuizController } from './quiz.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

// ==========================================
// INSTRUCTOR ROUTES (Manage Quizzes & Question Bank)
// ==========================================
router.post(
  '/',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.createQuiz
);

router.get(
  '/instructor/my-quizzes',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.getInstructorQuizzes
);

router.put(
  '/:quizId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.updateQuiz
);

router.delete(
  '/:quizId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.deleteQuiz
);

router.post(
  '/:quizId/questions',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.addQuestion
);

router.put(
  '/questions/:questionId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.updateQuestion
);

router.delete(
  '/questions/:questionId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  QuizController.deleteQuestion
);

// ==========================================
// STUDENT & CLASSROOM ROUTES (Purchase-Gated Access)
// ==========================================
router.get(
  '/course/:courseId',
  optionalAuthenticate,
  QuizController.getQuizzesByCourse
);

router.get(
  '/:quizId',
  optionalAuthenticate,
  QuizController.getQuizById
);

router.post(
  '/:quizId/start',
  authenticate,
  QuizController.startQuizAttempt
);

router.post(
  '/:quizId/submit',
  authenticate,
  QuizController.submitQuizAttempt
);

export const quizRoutes = router;
