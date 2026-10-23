import { apiClient } from './client';

export interface CourseDropdownItem {
  _id: string;
  title: string;
  slug: string;
  coursePrice: number;
  currency: string;
  status: string;
  instructor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface Coupon {
  _id: string;
  code: string;
  courseId: {
    _id: string;
    title: string;
    slug?: string;
    coursePrice?: number;
    currency?: string;
    status?: string;
  };
  instructorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  ownerType: 'SUPER_ADMIN' | 'INSTRUCTOR';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  currency: string;
  minimumAmount: number;
  maximumDiscount?: number;
  usageLimit: number;
  usedCount: number;
  remainingUses: number;
  perUserLimit: number;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  derivedStatus: 'ACTIVE' | 'NOT_YET_ACTIVE' | 'EXPIRED' | 'USAGE_LIMIT_REACHED' | 'INACTIVE' | 'ARCHIVED';
  description?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalRedemptions: number;
}

export interface CouponListResponse {
  coupons: Coupon[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  stats: CouponStats;
}

export interface CreateCouponPayload {
  code: string;
  courseId: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  currency?: string;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit: number;
  perUserLimit?: number;
  startDate: string;
  expiryDate: string;
  status?: 'ACTIVE' | 'INACTIVE';
  description?: string;
}

export interface UpdateCouponPayload {
  code?: string;
  courseId?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate?: string;
  expiryDate?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  description?: string;
}


export interface CourseDiscountItem {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category?: string;
  status?: string;
  coursePrice: number;
  discountPrice: number;
  discountPercent: number;
  rawDiscountPercent: number;
  discountValidUntil: string | null;
  isDiscountActive: boolean;
  isExpired: boolean;
  discountAppliedByRole: 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'NONE';
  discountAppliedBy?: {
    id: string;
    name: string;
    role: string;
  } | null;
  discountAppliedAt?: string | null;
  instructor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AvailableOffersResponse {
  hasCoupon: boolean;
  availableCount: number;
  offerBadge?: string;
}

export const couponApi = {
  // 1. Super Admin: List all coupons with filters & stats
  async getCoupons(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    discountType?: string;
    courseId?: string;
  }): Promise<{ success: boolean; data: CouponListResponse }> {
    const response = await apiClient.get('/coupons', { params });
    return response.data;
  },

  // 2. Super Admin: Get published courses list for coupon creation dropdown
  async getCoursesDropdown(): Promise<{ success: boolean; data: CourseDropdownItem[] }> {
    const response = await apiClient.get('/coupons/courses/dropdown');
    return response.data;
  },

  // 3. Super Admin: Get single coupon
  async getCouponById(couponId: string): Promise<{ success: boolean; data: Coupon }> {
    const response = await apiClient.get(`/coupons/${couponId}`);
    return response.data;
  },

  // 4. Super Admin: Create new coupon
  async createCoupon(payload: CreateCouponPayload): Promise<{ success: boolean; data: Coupon }> {
    const response = await apiClient.post('/coupons', payload);
    return response.data;
  },

  // 5. Super Admin: Update coupon
  async updateCoupon(couponId: string, payload: UpdateCouponPayload): Promise<{ success: boolean; data: Coupon }> {
    const response = await apiClient.patch(`/coupons/${couponId}`, payload);
    return response.data;
  },

  // 6. Super Admin: Toggle Status
  async updateCouponStatus(couponId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<{ success: boolean; data: Coupon }> {
    const response = await apiClient.patch(`/coupons/${couponId}/status`, { status });
    return response.data;
  },

  // 7. Super Admin: Delete / Archive coupon
  async deleteCoupon(couponId: string): Promise<{ success: boolean; message: string; data: { couponId: string } }> {
    const response = await apiClient.delete(`/coupons/${couponId}`);
    return response.data;
  },

  // 8. Public: Get available offers for course details/cards
  async getAvailableOffers(courseId: string): Promise<{ success: boolean; data: AvailableOffersResponse }> {
    const response = await apiClient.get(`/courses/${courseId}/available-offers`);
    return response.data;
  },

  // 9. Course Discounts: List all courses with discount state
  async getCourseDiscounts(params?: { search?: string; status?: string }): Promise<{ success: boolean; data: CourseDiscountItem[] }> {
    const response = await apiClient.get('/coupons/course-discounts', { params });
    return response.data;
  },

  // 10. Course Discounts: Update or clear discount
  async updateCourseDiscount(
    courseId: string,
    payload: { discountPercent: number; discountValidUntil: string | null }
  ): Promise<{ success: boolean; data: CourseDiscountItem }> {
    const response = await apiClient.patch(`/coupons/course-discounts/${courseId}`, payload);
    return response.data;
  },
};