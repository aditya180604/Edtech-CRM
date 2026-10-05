import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// All Cart operations require user authentication
router.use(authenticate);

router.get('/cart', CartController.getCart);
router.post('/cart/items', CartController.addItem);
router.delete('/cart/items/:productId', CartController.removeItem);
router.delete('/cart', CartController.clearCart);
router.post('/cart/merge', CartController.mergeGuestCart);

export const cartRoutes = router;
