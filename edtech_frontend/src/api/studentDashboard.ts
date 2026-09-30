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
