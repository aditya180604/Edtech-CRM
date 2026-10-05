import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// All notification endpoints require authenticated user (student or instructor)
router.use(authenticate);

router.get('/', NotificationsController.getMyNotifications);
router.patch('/mark-all-read', NotificationsController.markAllAsRead);
router.patch('/:id/read', NotificationsController.markAsRead);

export const notificationsRoutes = router;
