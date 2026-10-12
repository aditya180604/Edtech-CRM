import { apiClient } from './client';

export interface TeachingSlotItem {
  _id: string;
  slotId: string;
  instructorId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    email: string;
    headline?: string;
  };
  courseId?: {
    _id: string;
    title: string;
    slug: string;
    thumbnail?: string;
  };
  title: string;
  description?: string;
  slotType: 'ONE_ON_ONE' | 'SMALL_GROUP' | 'LIVE_CLASS';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  status: 'AVAILABLE' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  price: number;
  currency?: string;
  meetingType: 'IN_PLATFORM' | 'EXTERNAL';
  roomCode?: string;
  meetingUrl?: string;
  timeZone?: string;
  bookings?: BookingItem[];
}

export interface BookingItem {
  _id: string;
  bookingCode: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
  };
  slotId: TeachingSlotItem;
  instructorId?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    headline?: string;
  };
  courseId?: {
    _id: string;
    title: string;
    slug: string;
    thumbnail?: string;
  };
  notes?: string;
  status: 'CONFIRMED' | 'ATTENDED' | 'CANCELLED' | 'RESCHEDULED';
  bookedAt: string;
  cancellationReason?: string;
}

export const slotsApi = {
  // Public / Student: Fetch available slots
  async getAvailableSlots(params?: {
    instructorId?: string;
    courseId?: string;
    slotType?: string;
    fromDate?: string;
  }): Promise<{ success: boolean; data: TeachingSlotItem[] }> {
    const res = await apiClient.get('/slots/available', { params });
    return res.data;
  },

  // Student: Book slot
  async bookSlot(
    slotId: string,
    body?: { notes?: string }
  ): Promise<{
    success: boolean;
    data: {
      booking: BookingItem;
      slot: TeachingSlotItem;
      roomCode?: string;
      meetingUrl?: string;
    };
    message?: string;
  }> {
    const res = await apiClient.post(`/slots/${slotId}/book`, body || {});
    return res.data;
  },

  // Student: Get my bookings
  async getMyBookings(params?: { status?: string }): Promise<{ success: boolean; data: BookingItem[] }> {
    const res = await apiClient.get('/slots/my-bookings', { params });
    return res.data;
  },

  // Student / Instructor: Cancel booking
  async cancelBooking(
    bookingId: string,
    body?: { reason?: string }
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post(`/slots/bookings/${bookingId}/cancel`, body || {});
    return res.data;
  },

  // Student: Reschedule booking
  async rescheduleBooking(
    bookingId: string,
    body: { newSlotId: string }
  ): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.post(`/slots/bookings/${bookingId}/reschedule`, body);
    return res.data;
  },

  // Instructor: Create a new slot
  async createInstructorSlot(data: {
    title: string;
    description?: string;
    courseId?: string;
    slotType?: 'ONE_ON_ONE' | 'SMALL_GROUP' | 'LIVE_CLASS';
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    capacity?: number;
    price?: number;
    timeZone?: string;
  }): Promise<{ success: boolean; data: TeachingSlotItem; message?: string }> {
    const res = await apiClient.post('/slots/instructor', data);
    return res.data;
  },

  // Instructor: Get all my slots
  async getInstructorSlots(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ success: boolean; data: TeachingSlotItem[] }> {
    const res = await apiClient.get('/slots/instructor', { params });
    return res.data;
  },

  // Instructor: Cancel a slot
  async cancelInstructorSlot(
    slotId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete(`/slots/instructor/${slotId}`, { data: { reason } });
    return res.data;
  },
};
