import { PaymentService } from './payment.service.js';

export class PaymentController {
  /**
   * GET /api/v1/payments/:orderId/status
   * Authenticated endpoint for verifying payment state
   */
  static async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const studentUserId = req.user?._id;

      const result = await PaymentService.verifyAndReconcileOrderPayment(orderId, studentUserId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error.status || 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || 'PAYMENT_STATUS_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * POST /api/v1/payments/cashfree/webhook
   * Public webhook endpoint from Cashfree with signature verification
   */
  static async handleCashfreeWebhook(req, res) {
    try {
      const rawBody = req.rawBody || req.body;
      const headers = req.headers;
      const body = req.body;

      const result = await PaymentService.handleCashfreeWebhook({ rawBody, headers, body });

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data: result,
      });
    } catch (error) {
      console.error('[Cashfree Webhook Controller Error]:', error.message);
      const statusCode = error.status || 400;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: 'WEBHOOK_VERIFICATION_FAILED',
          message: error.message,
        },
      });
    }
  }
}
