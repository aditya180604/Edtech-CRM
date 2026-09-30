import { apiClient } from './client';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';

export const authApi = {
  // 1. User Registration (STUDENT | INSTRUCTOR)
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  // 2. User Login (All Roles: STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN)
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  // 3. Refresh Access Token
  async refresh(): Promise<{ statusCode: number; success: boolean; data: { accessToken: string } }> {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // 4. Logout User
  async logout(): Promise<{ statusCode: number; success: boolean; message: string }> {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // 5. Get Current Authenticated User Profile (/me)
  async getMe(): Promise<{ statusCode: number; success: boolean; data: User }> {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};
