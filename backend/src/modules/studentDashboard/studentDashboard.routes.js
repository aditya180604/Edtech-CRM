import { Router } from 'express';
import { StudentDashboardController } from './studentDashboard.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

// Route strictly scoped to STUDENT role
router.get(
  '/',
  authenticate,
  authorize(ROLES.STUDENT),
  StudentDashboardController.getDashboardOverview
);

export const studentDashboardRoutes = router;
