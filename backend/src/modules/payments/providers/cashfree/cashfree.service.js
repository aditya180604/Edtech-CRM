import { CashfreeClient } from './cashfree.client.js';
import { PAYMENT_STATUS } from '../../../../config/constants.js';

export class CashfreeService {
  /**
   * Normalize Cashfree payment status to LMS standard status
   */
  static normalizePaymentStatus(cfStatus) {
    if (!cfStatus) return PAYMENT_STATUS.PENDING;

    switch (cfStatus.toUpperCase()) {
      case 'SUCCESS':
        return PAYMENT_STATUS.SUCCESS;
      case 'FAILED':
        return PAYMENT_STATUS.FAILED;
      case 'CANCELLED':
      case 'USER_DROPPED':
        return PAYMENT_STATUS.CANCELLED;
      case 'PENDING':
      default:
        return PAYMENT_STATUS.PENDING;
    }
  }

  /**
   * Create Cashfree Checkout Order & Payment Session
   */
  static async createOrder(orderData) {
    return CashfreeClient.createOrder(orderData);
  }

  /**
   * Fetch and evaluate latest payment transaction status for an order from Cashfree
   */
  static async getOrderPaymentStatus(orderId) {
    const payments = await CashfreeClient.getOrderPayments(orderId);

    if (!payments || payments.length === 0) {
      return {
        hasPayments: false,
        status: PAYMENT_STATUS.PENDING,
        latestPayment: null,
      };
    }

    // Sort by payment_time desc or pick successful payment first
    const successfulPayment = payments.find((p) => (p.payment_status || '').toUpperCase() === 'SUCCESS');
    const latestPayment = successfulPayment || payments[payments.length - 1];

    const normalizedStatus = this.normalizePaymentStatus(latestPayment.payment_status);

    return {
      hasPayments: true,
      status: normalizedStatus,
      rawStatus: latestPayment.payment_status,
      paymentId: latestPayment.cf_payment_id?.toString() || null,
      amount: latestPayment.payment_amount,
      currency: latestPayment.payment_currency,
      paymentMethod: latestPayment.payment_group || latestPayment.payment_method || 'CASHFREE',
      failureReason: latestPayment.payment_message || null,
      latestPayment,
      allPayments: payments,
    };
  }

  /**
   * Verify Cashfree Webhook Signature
   */
  static verifyWebhook({ rawBody, timestamp, signature }) {
    return CashfreeClient.verifyWebhookSignature({ rawBody, timestamp, signature });
  }
}
