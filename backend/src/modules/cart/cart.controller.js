import { CartService } from './cart.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class CartController {
  static getCart = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const cart = await CartService.getCart(userId);
    return ApiResponse.success(res, cart, 'Cart retrieved successfully.');
  });

  static addItem = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { productType, productId } = req.body;
    try {
      const cart = await CartService.addItem(userId, { productType, productId });
      return ApiResponse.success(res, cart, 'Item added to cart successfully.');
    } catch (error) {
      if (error.code === 'ALREADY_IN_CART' || error.code === 'ALREADY_OWNED') {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          message: error.message,
        });
      }
      throw error;
    }
  });

  static removeItem = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { productId } = req.params;
    const cart = await CartService.removeItem(userId, productId);
    return ApiResponse.success(res, cart, 'Item removed from cart.');
  });

  static clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const result = await CartService.clearCart(userId);
    return ApiResponse.success(res, result, 'Cart cleared.');
  });

  static mergeGuestCart = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { items } = req.body;
    const cart = await CartService.mergeGuestCart(userId, items);
    return ApiResponse.success(res, cart, 'Guest cart merged successfully.');
  });
}
