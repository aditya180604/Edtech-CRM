import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

/**
 * 1. Cashfree Webhook Route (Public, Signature-Verified)
 * POST /api/v1/payments/cashfree/webhook
 */
router.post('/cashfree/webhook', PaymentController.handleCashfreeWebhook);

/**
 * 2. Authenticated Payment Status Verification
 * GET /api/v1/payments/:orderId/status
 */
router.get('/:orderId/status', authenticate, PaymentController.getPaymentStatus);

export const paymentRoutes = router;
export default router;
