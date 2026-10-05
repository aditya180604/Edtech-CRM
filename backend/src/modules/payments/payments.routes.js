import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Create Cashfree Order for course publishing platform fee
router.post('/cashfree/create-order', authenticate, PaymentsController.createPublishingFeeOrder);

// Cashfree Order Status Verification
router.get('/cashfree/:orderId/status', authenticate, PaymentsController.verifyPublishingFee);

// Public Webhook route called by Cashfree PG
router.post('/cashfree/webhook', PaymentsController.cashfreeWebhook);

export const paymentRoutes = router;
