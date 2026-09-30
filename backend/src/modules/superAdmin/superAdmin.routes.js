import { Router } from 'express';
import { SuperAdminController } from './superAdmin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeSuperAdmin } from '../../middleware/rbac.js';

const router = Router();

// Strict Security Barrier: All super-admin endpoints require authenticate + authorize('SUPER_ADMIN')
router.use(authenticate);
router.use(authorizeSuperAdmin);

router.get('/status', SuperAdminController.getStatus);
router.get('/audit-logs', SuperAdminController.getAuditLogs);

export const superAdminRoutes = router;
