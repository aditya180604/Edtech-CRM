import { Router } from 'express';
import { CheckoutController } from './checkout.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Strict Authentication required for all checkout operations
router.use(authenticate);

router.post('/checkout/quote', CheckoutController.getQuote);
router.post('/checkout', CheckoutController.processCheckout);
router.get('/checkout/:orderId/status', CheckoutController.getCheckoutStatus);
router.get('/checkout/:orderId', CheckoutController.getOrderDetails);

export const checkoutRoutes = router;
