import { CheckoutService } from './checkout.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class CheckoutController {
  static getQuote = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { couponCode } = req.body;
    try {
      const quote = await CheckoutService.getQuote({ userId, couponCode });
      return ApiResponse.success(res, quote, 'Pricing quote calculated successfully.');
    } catch (error) {
      if (error.code) {
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

  static processCheckout = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { couponCode, paymentMethod, idempotencyKey } = req.body;
    const headerIdempotency = req.headers['idempotency-key'] || idempotencyKey;

    try {
      const result = await CheckoutService.processCheckout({
        userId,
        couponCode,
        paymentMethod,
        idempotencyKey: headerIdempotency,
      });

      return ApiResponse.success(res, result, result.message || 'Checkout successful.');
    } catch (error) {
      if (error.code) {
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

  static getOrderDetails = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { orderId } = req.params;
    const order = await CheckoutService.getOrderDetails(orderId, userId);
    return ApiResponse.success(res, order, 'Order details retrieved.');
  });

  static getCheckoutStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user._id;
    const { orderId } = req.params;
    const status = await CheckoutService.getCheckoutStatus(orderId, userId);
    return ApiResponse.success(res, status, 'Payment status verified successfully.');
  });
}
