import { Router } from 'express';
import { CheckoutController } from './checkout.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';

const router = Router();

// Pricing quote is accessible to both guests and authenticated students
router.post('/checkout/quote', optionalAuthenticate, CheckoutController.getQuote);

// Strict Authentication required for final checkout operations
router.post('/checkout', authenticate, CheckoutController.processCheckout);
router.get('/checkout/:orderId/status', authenticate, CheckoutController.getCheckoutStatus);
router.get('/checkout/:orderId', authenticate, CheckoutController.getOrderDetails);

export const checkoutRoutes = router;
