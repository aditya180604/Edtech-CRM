import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { InstructorController } from '../instructor/instructor.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Course publishing fee has been removed: never open a Cashfree order for it.
router.post('/cashfree/create-order', authenticate, InstructorController.createPublishingFeeOrder);

// Cashfree Order Status Verification (historical publishing-fee orders)
router.get('/cashfree/:orderId/status', authenticate, PaymentsController.verifyPublishingFee);

// Public Webhook route called by Cashfree PG
router.post('/cashfree/webhook', PaymentsController.cashfreeWebhook);

export const paymentRoutes = router;
