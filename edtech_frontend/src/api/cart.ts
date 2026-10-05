import { apiClient } from './client';

export interface CartLineItem {
  productId: string;
  productType: 'COURSE' | 'CONTENT_OFFERING';
  courseId?: string;
  topicId?: string;
  title: string;
  slug?: string;
  thumbnail?: string;
  instructorId?: string;
  instructorName?: string;
  unitPrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
  status?: string;
  alreadyOwned?: boolean;
  unavailable?: boolean;
  isEligibleForCoupon?: boolean;
}

export interface BackendCartResponse {
  cartId: string;
  items: CartLineItem[];
  subtotal: number;
  discount: number;
  finalAmount: number;
  currency: string;
  itemCount: number;
}

export const cartApi = {
  // 1. Get current user's authoritative cart
  async getCart(): Promise<{ success: boolean; data: BackendCartResponse }> {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  // 2. Add course / offering to cart
  async addItem(payload: {
    productType?: 'COURSE' | 'CONTENT_OFFERING';
    productId: string;
  }): Promise<{ success: boolean; data: BackendCartResponse; message?: string }> {
    const response = await apiClient.post('/cart/items', payload);
    return response.data;
  },

  // 3. Remove product from cart
  async removeItem(productId: string): Promise<{ success: boolean; data: BackendCartResponse }> {
    const response = await apiClient.delete(`/cart/items/${productId}`);
    return response.data;
  },

  // 4. Clear cart
  async clearCart(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/cart');
    return response.data;
  },

  // 5. Merge guest cart items upon login
  async mergeGuestCart(items: Array<{ productType: string; productId: string }>): Promise<{ success: boolean; data: BackendCartResponse }> {
    const response = await apiClient.post('/cart/merge', { items });
    return response.data;
  },
};
