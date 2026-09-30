import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes.js';
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

export const apiRouter = router;
