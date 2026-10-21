import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { AuthValidator } from '../../middleware/validators/auth.validator.js';
import { rateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// Per-IP limits on credential and email-sending endpoints (generous enough for shared NATs).
const loginLimit = rateLimit({ name: 'auth-login', windowMs: 60 * 1000, max: 30 });
const registerLimit = rateLimit({ name: 'auth-register', windowMs: 60 * 1000, max: 15 });
const passwordResetLimit = rateLimit({ name: 'auth-password-reset', windowMs: 15 * 60 * 1000, max: 10 });
const refreshLimit = rateLimit({ name: 'auth-refresh', windowMs: 60 * 1000, max: 120 });
const authMethodLimit = rateLimit({ name: 'auth-method', windowMs: 60 * 1000, max: 60 });

router.post('/register', registerLimit, AuthValidator.validateRegister, AuthController.register);
router.post('/login', loginLimit, AuthValidator.validateLogin, AuthController.login);
router.post('/firebase-login', loginLimit, AuthController.firebaseLogin);
router.post('/forgot-password', passwordResetLimit, AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimit, AuthController.resetPassword);
router.post('/refresh', refreshLimit, AuthValidator.validateRefresh, AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);
router.get('/auth-method', authMethodLimit, AuthController.checkAuthMethod);

export const authRoutes = router;

