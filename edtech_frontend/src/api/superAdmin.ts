import { apiClient } from './client';
import type { User } from '../types';

export interface SuperAdminStatus {
  governanceStatus: string;
  database: {
    name: string;
    status: string;
  };
  counts: {
    users: number;
    students: number;
    instructors: number;
    admins: number;
    courses: number;
    orders: number;
  };
  recentActivity: Array<{
    _id: string;
    action: string;
    resourceType: string;
    timestamp: string;
    ipAddress?: string;
  }>;
  authenticatedSuperAdmin: string;
  timestamp: string;
}

export interface UserCounts {
  all: number;
  students: number;
  instructors: number;
  admins: number;
  superAdmins: number;
}

export interface RealtimeUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  counts: UserCounts;
  timestamp: string;
}

export const superAdminApi = {
  // 1. Get Live Super Admin System Status
  async getStatus(): Promise<{ success: boolean; data: SuperAdminStatus }> {
    const response = await apiClient.get('/super-admin/status');
    return response.data;
  },

  // 2. Query Real-Time Platform Users (Students, Instructors, Admins, Super Admins)
  async getUsers(params?: {
    role?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ success: boolean; data: RealtimeUsersResponse }> {
    const response = await apiClient.get('/super-admin/users', { params });
    return response.data;
  },

  // 3. Update User Status / Role
  async updateUserStatus(
    userId: string,
    payload: { status?: string; role?: string }
  ): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.patch(`/super-admin/users/${userId}/status`, payload);
    return response.data;
  },
};
