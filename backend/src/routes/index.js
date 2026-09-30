import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes.js';
import { studentDashboardRoutes } from '../modules/studentDashboard/studentDashboard.routes.js';
import { catalogRoutes } from '../modules/catalog/catalog.routes.js';
import { ApiResponse } from '../utils/apiResponse.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return ApiResponse.success(
    res,
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    },
    'API v1 is operational'
  );
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/dashboard/student', studentDashboardRoutes);
router.use('/catalog', catalogRoutes);
router.use('/', catalogRoutes); // direct aliases like /courses, /topics, /webinars, etc.

export const apiRouter = router;


