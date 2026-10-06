import { apiClient } from './client';
import type { CartLineItem } from './cart';

export interface AppliedCouponQuote {
  applied: boolean;
  couponId?: string;
  code?: string;
  courseId?: string;
  courseTitle?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountAmount?: number;
  validUntil?: string;
  remainingUses?: number;
  description?: string;
}

export interface CheckoutQuoteResponse {
  items: CartLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  credit: number;
  finalAmount: number;
  currency: string;
  coupon: AppliedCouponQuote;
  itemCount: number;
}

export interface CheckoutProcessPayload {
  couponCode?: string;
  paymentMethod?: string;
  idempotencyKey?: string;
}

export interface CheckoutOrderResult {
  orderId: string;
  items: CartLineItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  couponCode?: string;
  finalAmount: number;
  currency: string;
  createdAt: string;
}

export interface CheckoutProcessResponse {
  success: boolean;
  orderId?: string;
  order?: CheckoutOrderResult;
  paymentSessionId?: string;
  orderAmount?: number;
  currency?: string;
  isZeroAmount?: boolean;
  isIdempotentReplay?: boolean;
  paymentStatus?: string;
  message?: string;
  data?: {
    orderId: string;
    paymentSessionId: string;
    orderAmount: number;
    currency: string;
    customer?: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  };
}

export const checkoutApi = {
  // 1. Get Live Authoritative Pricing Quote
  async getQuote(payload?: { couponCode?: string; items?: any[] }): Promise<{ success: boolean; data: CheckoutQuoteResponse }> {
    const response = await apiClient.post('/checkout/quote', payload || {});
    return response.data;
  },

  // 2. Process Final Checkout & Enrollment
  async processCheckout(payload: CheckoutProcessPayload): Promise<{ success: boolean; data: CheckoutProcessResponse; message?: string }> {
    const headers: Record<string, string> = {};
    if (payload.idempotencyKey) {
      headers['idempotency-key'] = payload.idempotencyKey;
    }
    const response = await apiClient.post('/checkout', payload, { headers });
    return response.data;
  },

  // 3. Get Order Details
  async getOrderDetails(orderId: string): Promise<{ success: boolean; data: any }> {
    const response = await apiClient.get(`/checkout/${orderId}`);
    return response.data;
  },
};
