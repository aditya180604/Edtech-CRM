import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { AuthValidator } from '../../middleware/validators/auth.validator.js';

const router = Router();

router.post('/register', AuthValidator.validateRegister, AuthController.register);
router.post('/login', AuthValidator.validateLogin, AuthController.login);
router.post('/firebase-login', AuthController.firebaseLogin);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.post('/refresh', AuthValidator.validateRefresh, AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.get('/auth-method', AuthController.checkAuthMethod);

export const authRoutes = router;

