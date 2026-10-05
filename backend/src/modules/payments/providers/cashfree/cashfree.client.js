import crypto from 'crypto';
import { cashfreeConfig, validateCashfreeConfig } from '../../../../config/cashfree.js';

export class CashfreeClient {
  static getHeaders() {
    validateCashfreeConfig();
    return {
      'x-client-id': cashfreeConfig.appId,
      'x-client-secret': cashfreeConfig.secretKey,
      'x-api-version': cashfreeConfig.apiVersion,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * 1. CREATE PG ORDER
   * https://sandbox.cashfree.com/pg/orders
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
    orderNote,
  }) {
    const headers = this.getHeaders();
    const url = `${cashfreeConfig.baseUrl}/orders`;

    const payload = {
      order_id: orderId,
      order_amount: Number(orderAmount),
      order_currency: currency.toUpperCase(),
      customer_details: {
        customer_id: customerId.toString(),
        customer_name: (customerName || 'Student').trim().slice(0, 100),
        customer_email: customerEmail,
        customer_phone: (customerPhone || '9999999999').replace(/[^0-9]/g, '').slice(-10) || '9999999999',
      },
      order_meta: {
        return_url: returnUrl || `${cashfreeConfig.frontendUrl}/checkout/result?order_id={order_id}`,
        notify_url: notifyUrl || `${cashfreeConfig.backendPublicUrl}/api/v1/payments/cashfree/webhook`,
      },
      order_note: orderNote || `EdTech Course Checkout - ${orderId}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error?.message || `Cashfree Create Order failed with HTTP ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  /**
   * 2. FETCH ORDER PAYMENTS
   * GET /orders/{order_id}/payments
   */
  static async getOrderPayments(orderId) {
    if (!orderId) {
      throw new Error('Order ID required to fetch Cashfree payments.');
    }

    const headers = this.getHeaders();
    const url = `${cashfreeConfig.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || `Failed to fetch Cashfree payments for order ${orderId}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return Array.isArray(data) ? data : [];
  }

  /**
   * 3. VERIFY WEBHOOK SIGNATURE
   * Uses HMAC-SHA256(timestamp + rawBody, secretKey) in Base64
   */
  static verifyWebhookSignature({ rawBody, timestamp, signature }) {
    if (!signature || !timestamp || !rawBody) {
      return false;
    }

    try {
      const secret = cashfreeConfig.secretKey;
      if (!secret) return false;

      const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
      const signaturePayload = `${timestamp}${bodyString}`;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signaturePayload)
        .digest('base64');

      const expectedBuf = Buffer.from(expectedSignature, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');

      if (expectedBuf.length !== actualBuf.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch (err) {
      console.error('[Cashfree Signature Verification Error]:', err.message);
      return false;
    }
  }
}
