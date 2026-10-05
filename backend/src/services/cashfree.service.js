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
    orderNote = 'Publishing Fee',
  }) {
    const body = {
      order_id: orderId,
      order_amount: Number(orderAmount),
      order_currency: currency,
      customer_details: {
        customer_id: customerId.replace(/[^a-zA-Z0-9_-]/g, '_'),
        customer_name: customerName || 'Instructor',
        customer_email: customerEmail || 'instructor@example.com',
        customer_phone: customerPhone || '9999999999',
      },
      order_meta: {
        return_url: returnUrl || 'http://localhost:5173/instructor/courses',
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
}
