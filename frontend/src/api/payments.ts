import { apiClient } from './client';

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_modal' | HTMLElement;
      }) => Promise<any>;
    };
  }
}

export interface PaymentStatusResponse {
  orderId: string;
  paymentStatus: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  orderStatus: 'PAYMENT_PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'COMPLETED';
  amount?: number;
  currency?: string;
  paidAt?: string;
  failureReason?: string;
}

/**
 * Initializes and returns Cashfree SDK instance in sandbox or production mode.
 */
export const getCashfreeInstance = (mode: 'sandbox' | 'production' = 'sandbox') => {
  if (typeof window === 'undefined' || !window.Cashfree) {
    throw new Error('Cashfree SDK is not loaded. Please ensure script is included.');
  }
  return window.Cashfree({ mode });
};

export const paymentsApi = {
  /**
   * 1. Query verified payment status from backend
   */
  async getPaymentStatus(orderId: string): Promise<{ success: boolean; data: PaymentStatusResponse }> {
    const response = await apiClient.get(`/payments/${orderId}/status`);
    return response.data;
  },

  /**
   * 2. Trigger Cashfree SDK Checkout Modal or Redirect
   */
  async launchCashfreeCheckout({
    paymentSessionId,
    mode = 'sandbox',
    redirectTarget = '_self',
  }: {
    paymentSessionId: string;
    mode?: 'sandbox' | 'production';
    redirectTarget?: '_self' | '_blank' | '_modal';
  }) {
    const cf = getCashfreeInstance(mode);
    return cf.checkout({
      paymentSessionId,
      redirectTarget,
    });
  },
};
