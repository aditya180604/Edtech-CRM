import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Public verified skill passport route (publicly shareable)
router.get('/passport/:identifier', UsersController.getPassport);

router.use(authenticate);

router.get('/me', UsersController.getMe);
router.put('/me', UsersController.updateMe);
router.patch('/me', UsersController.updateMe);

export const usersRoutes = router;
