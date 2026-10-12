import { apiClient } from './client';

export interface WeeklyTimeSlot {
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "12:00"
}

export interface DayAvailability {
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  isEnabled: boolean;
  slots: WeeklyTimeSlot[];
}

export interface ConsultationSettings {
  consultationEnabled: boolean;
  consultationFee: number;
  consultationDuration: number;
  consultationTimezone: string;
  consultationBufferMinutes: number;
  consultationSetupCompleted: boolean;
  consultationPublished: boolean;
  weeklyAvailability: DayAvailability[];
  unavailableDates: string[];
}

export interface ConsultationMentor {
  id: string;
  instructorId: string;
  userId: string;
  name: string;
  headline: string;
  bio?: string;
  profilePhoto?: string | null;
  expertise: string[];
  skills: string[];
  yearsOfExperience?: string | number;
  currentOrganization?: string;
  consultationFee: number;
  consultationDuration: number;
  consultationTimezone: string;
  consultationBufferMinutes: number;
  weeklyAvailability?: DayAvailability[];
  averageRating: number;
  reviewCount: number;
}

export interface BookableSlot {
  slotId: string;
  date: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationMinutes: number;
  fee: number;
  currency: string;
  isAvailable: boolean;
}

export interface MentorAvailabilityResponse {
  instructorId: string;
  consultationEnabled: boolean;
  consultationFee: number;
  consultationDuration: number;
  consultationTimezone: string;
  totalAvailableSlots: number;
  slots: BookableSlot[];
  message?: string;
}

export interface ConsultationBooking {
  id: string;
  bookingCode: string;
  student?: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string | null;
  } | null;
  instructor?: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string | null;
    headline?: string;
  } | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  fee: number;
  currency: string;
  status: 'CONFIRMED' | 'PENDING_PAYMENT' | 'ATTENDED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'FREE' | 'PENDING' | 'FAILED' | 'REFUNDED';
  isCompleted?: boolean;
  consultationReview?: {
    rating: number;
    review: string;
    submittedAt: string;
  } | null;
  meetingRoomCode?: string;
  meetingUrl?: string;
  notes?: string;
  bookedAt?: string;
}

export interface ReservationResponse {
  success: boolean;
  isFree: boolean;
  booking?: ConsultationBooking;
  bookingId?: string;
  bookingCode?: string;
  fee?: number;
  currency?: string;
  paymentSessionId?: string;
  orderId?: string;
  reservationExpiresAt?: string;
  message?: string;
}

export const consultationsApi = {
  // 1. Get Directory of Mentors Offering 1-on-1 Consultations
  getMentors: async (params?: { search?: string; expertise?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<any>('/consultations/instructors', { params });
    return res.data?.data || res.data || [];
  },

  // 2. Get Available Dynamic Slots for a Mentor
  getMentorAvailability: async (instructorId: string, params?: { startDate?: string; days?: number }) => {
    const res = await apiClient.get<any>(`/consultations/instructors/${instructorId}/availability`, { params });
    return res.data?.data || res.data;
  },

  // 3. Get Instructor Settings (Instructor Dashboard)
  getInstructorSettings: async () => {
    const res = await apiClient.get<any>('/consultations/instructor/settings');
    return res.data?.data || res.data;
  },

  // 4. Update Instructor Settings (Toggle, Fee, Duration, Timezone, Buffer)
  updateInstructorSettings: async (payload: Partial<ConsultationSettings>) => {
    const res = await apiClient.patch<any>('/consultations/instructor/settings', payload);
    return res.data?.data || res.data;
  },

  // 5. Save Weekly Schedule & Exceptions
  saveWeeklyAvailability: async (payload: { weeklyAvailability: DayAvailability[]; unavailableDates?: string[] }) => {
    const res = await apiClient.post<any>('/consultations/instructor/availability', payload);
    return res.data?.data || res.data;
  },

  // 6. Create Booking Reservation (Student Flow)
  createBookingReservation: async (payload: {
    instructorId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<ReservationResponse> => {
    const res = await apiClient.post<any>('/consultations/bookings', payload);
    return res.data?.data || res.data;
  },

  // 7. Verify Cashfree Payment
  verifyPayment: async (payload: { bookingId?: string; orderId?: string }) => {
    const res = await apiClient.post<any>('/consultations/bookings/verify-payment', payload);
    return res.data?.data || res.data;
  },

  // 8. Get Booked Consultations for Current User
  getMyConsultations: async (): Promise<ConsultationBooking[]> => {
    const res = await apiClient.get<any>('/consultations/bookings/me');
    return res.data?.data || res.data || [];
  },

  // 10. Submit a review for a completed consultation
  submitReview: async (
    bookingId: string,
    payload: { rating: number; review: string }
  ): Promise<NonNullable<ConsultationBooking['consultationReview']>> => {
    const res = await apiClient.post<any>(`/consultations/bookings/${bookingId}/review`, payload);
    return res.data?.data || res.data;
  },

  // 9. Generate LiveKit Join Session Token
  generateJoinToken: async (bookingId: string) => {
    const res = await apiClient.post<any>(`/consultations/bookings/${bookingId}/join`);
    return res.data?.data || res.data;
  },
};
