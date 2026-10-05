import crypto from 'crypto';
import { config } from '../config/env.js';

export class CashfreeService {
  /**
   * Helper to make authenticated Cashfree PG API requests
   */
  static async request(endpoint, options = {}) {
    const url = `${config.cashfree.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-version': config.cashfree.apiVersion,
      'x-client-id': config.cashfree.appId,
      'x-client-secret': config.cashfree.secretKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[Cashfree API Error]:', data);
        throw new Error(data.message || data.error || `Cashfree API returned status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error('[Cashfree Request Failed]:', err);
      throw err;
    }
  }

  /**
   * 1. Create a payment order for Publishing Fee
   */
  static async createOrder({
    orderId,
    orderAmount,
    currency = 'INR',
    customerId,
    customerName,
    customerEmail,
    customerPhone = '9999999999',
    returnUrl,
    notifyUrl,
    orderNote = 'Platform Publishing Fee (10%)',
  }) {
    const formattedAmount = Number(Number(orderAmount).toFixed(2));
    const sanitizedCustomerId = (customerId || 'CUST_DEFAULT')
      .toString()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);

    const body = {
      order_id: orderId,
      order_amount: formattedAmount,
      order_currency: currency,
      customer_details: {
        customer_id: sanitizedCustomerId,
        customer_name: customerName || 'Instructor',
        customer_email: customerEmail || 'instructor@example.com',
        customer_phone:
          customerPhone && customerPhone.length >= 10
            ? customerPhone.replace(/\D/g, '').slice(-10)
            : '9999999999',
      },
      order_meta: {
        return_url: returnUrl || 'http://localhost:5173/dashboard/instructor',
        ...(notifyUrl ? { notify_url: notifyUrl } : {}),
      },
      order_note: orderNote,
    };

    const result = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      orderId: result.order_id,
      cfOrderId: result.cf_order_id,
      paymentSessionId: result.payment_session_id,
      orderStatus: result.order_status,
      orderAmount: result.order_amount,
      orderCurrency: result.order_currency,
      environment: config.cashfree.env,
    };
  }

  /**
   * 2. Fetch order status
   */
  static async getOrder(orderId) {
    return await this.request(`/orders/${orderId}`, {
      method: 'GET',
    });
  }

  /**
   * 3. Fetch payment attempts for order
   */
  static async getOrderPayments(orderId) {
    return await this.request(`/orders/${orderId}/payments`, {
      method: 'GET',
    });
  }

  /**
   * 4. Verify Cashfree Webhook Signature (HMAC-SHA256)
   */
  static verifyWebhookSignature(signature, rawBody, timestamp) {
    if (!signature || !rawBody || !timestamp) {
      return false;
    }
    try {
      const secretKey = config.cashfree.secretKey;
      const signatureData = `${timestamp}${rawBody}`;
      const computedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(signatureData)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(computedSignature, 'utf8')
      );
    } catch (err) {
      console.error('[Cashfree Signature Verification Error]:', err.message);
      return false;
    }
  }
}
