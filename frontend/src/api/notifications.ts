import { apiClient } from './client';

export interface DashboardNotification {
  _id: string;
  notificationId?: string;
  type: string;
  title: string;
  message: string;
  status?: string;
  meetingUrl?: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActiveStartedWebinar {
  id: string;
  title: string;
  category?: string;
  meetingUrl?: string;
  startTime: string;
  endTime: string;
  status: string;
  isInstructor: boolean;
}

export interface NotificationsResponse {
  notifications: DashboardNotification[];
  unreadCount: number;
  activeStartedWebinars: ActiveStartedWebinar[];
}

export const notificationsApi = {
  getNotifications: async (): Promise<{ success: boolean; data: NotificationsResponse }> => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },
};
