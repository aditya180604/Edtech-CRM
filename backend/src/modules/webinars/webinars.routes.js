import { Router } from 'express';
import { WebinarsController } from './webinars.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// Public Webinar Discovery Routes (with optional user context for registration status)
router.get('/upcoming', optionalAuthenticate, WebinarsController.getUpcoming);
router.get('/', optionalAuthenticate, WebinarsController.getCatalog);
router.get('/:id', optionalAuthenticate, WebinarsController.getDetails);

// Student / User Registration Endpoint (Requirement 3)
router.post('/:id/register', authenticate, WebinarsController.register);

export const webinarsRoutes = router;
