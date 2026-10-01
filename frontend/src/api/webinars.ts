import { apiClient } from './client';

export interface WebinarItem {
  _id: string;
  id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  category: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  capacity?: number;
  price: number;
  currency?: string;
  status: string;
  isLive: boolean;
  instructorId?: string;
  instructorName: string;
  instructorAvatar?: string | null;
  registrationsCount?: number;
  isUserRegistered?: boolean;
  meetingUrl?: string | null;
  date: string;
  time: string;
}

export const webinarsApi = {
  // Fetch active and upcoming webinars sorted chronologically by date/time
  async getUpcomingWebinars(): Promise<{ success: boolean; data: { webinars: WebinarItem[]; count: number; hasUpcoming: boolean } }> {
    const res = await apiClient.get('/webinars/upcoming');
    return res.data;
  },

  // Fetch catalog / filtered webinars
  async getWebinars(params?: { category?: string; search?: string }): Promise<{ success: boolean; data: { webinars: WebinarItem[]; count: number; hasUpcoming: boolean } }> {
    const res = await apiClient.get('/webinars', { params });
    return res.data;
  },

  // Fetch webinar details
  async getWebinarById(id: string) {
    const res = await apiClient.get(`/webinars/${id}`);
    return res.data;
  },

  // Register for a webinar (Requirement 3)
  async register(webinarId: string): Promise<{ success: boolean; data: { registered: boolean; registrationsCount: number; message: string } }> {
    const res = await apiClient.post(`/webinars/${webinarId}/register`);
    return res.data;
  },
};
