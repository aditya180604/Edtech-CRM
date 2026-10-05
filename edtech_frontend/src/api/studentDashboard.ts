import { apiClient } from './client';
import type { StudentDashboardData } from '../types/studentDashboard';

export interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getStudentDashboard = async (): Promise<StudentDashboardData> => {
  const response = await apiClient.get<ApiResponseWrapper<StudentDashboardData>>('/dashboard/student');
  return response.data.data;
};

export const toggleWishlist = async (productId: string, productType = 'COURSE'): Promise<{ added: boolean; message: string }> => {
  const response = await apiClient.post<ApiResponseWrapper<{ added: boolean; message: string }>>('/dashboard/student/wishlist', {
    productId,
    productType,
  });
  return response.data.data;
};

export const getWishlistIds = async (): Promise<string[]> => {
  const response = await apiClient.get<ApiResponseWrapper<string[]>>('/dashboard/student/wishlist/ids');
  return response.data.data || [];
};
