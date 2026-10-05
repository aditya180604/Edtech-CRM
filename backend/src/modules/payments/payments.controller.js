import { PaymentsService } from './payments.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class PaymentsController {
  /**
   * 1. Create Cashfree Publishing Fee Order
   * POST /api/v1/instructor/courses/:id/publishing-fee/create-order
   */
  static createPublishingFeeOrder = asyncHandler(async (req, res) => {
    const courseId = req.params?.id || req.body?.courseId;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required.' });
    }
    const { returnUrl } = req.body || {};
    const result = await PaymentsService.createPublishingFeeOrder(req.user.userId, courseId, returnUrl);
    return ApiResponse.success(res, result, 'Cashfree publishing fee order created successfully.');
  });

  /**
   * 2. Verify Cashfree Publishing Fee Payment
   * POST /api/v1/instructor/courses/:id/publishing-fee/verify
   * GET  /api/v1/instructor/courses/:id/publishing-fee/status
   * GET  /api/v1/payments/cashfree/:orderId/status
   */
  static verifyPublishingFee = asyncHandler(async (req, res) => {
    const courseId = req.params?.id || req.query?.courseId || req.body?.courseId;
    const orderId = req.params?.orderId || req.body?.cashfreeOrderId || req.body?.orderId || req.query?.orderId;
    const result = await PaymentsService.verifyPublishingFeePayment(req.user.userId, courseId, orderId);
    return ApiResponse.success(res, result, result.message);
  });

  /**
   * 3. Webhook endpoint from Cashfree PG
   * POST /api/v1/payments/cashfree/webhook or /api/payments/cashfree/webhook
   */
  static cashfreeWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const result = await PaymentsService.handleCashfreeWebhook({
      signature,
      rawBody,
      timestamp,
      body: req.body,
    });

    return res.status(200).json({ status: 'ok', result });
  });

  /**
   * 4. Super Admin Platform Fees Overview
   * GET /api/v1/super-admin/platform-fees
   */
  static getPlatformFees = asyncHandler(async (req, res) => {
    const result = await PaymentsService.getPlatformFeesOverview(req.query);
    return ApiResponse.success(res, result, 'Platform fees overview retrieved.');
  });
}
