import { apiClient } from './client';

export interface AdminDashboardMetrics {
  totalStudents: number;
  newStudentsThisMonth: number;
  totalInstructors: number;
  pendingInstructors: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  verifiedPurchasesCount: number;
  totalOrdersCount: number;
  upcomingConsultationsCount: number;
  openSupportTicketsCount: number;
}

export interface AdminGrowthPoint {
  label: string;
  students: number;
  revenue: number;
}

export interface AdminActivityItem {
  id: string;
  action: string;
  resourceType: string;
  timestamp: string;
  actor: {
    name: string;
    email: string;
    role: string;
  };
}

export interface AdminUpcomingConsultation {
  id: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  fee: number;
  currency: string;
  student: {
    name: string;
    email: string;
    avatar: string | null;
  };
  instructor: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface AdminDashboardData {
  metrics: AdminDashboardMetrics;
  growthTimeline: AdminGrowthPoint[];
  recentActivity: AdminActivityItem[];
  upcomingConsultations: AdminUpcomingConsultation[];
}

export interface AdminStudentItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  country: string;
  registeredOn: string;
  coursesCount: number;
  totalSpent: number;
  currency: string;
}

export interface AdminInstructorItem {
  id: string;
  name: string;
  email: string;
  title: string;
  expertise: string[];
  organization: string;
  registeredOn: string;
  isVerified: boolean;
  verificationStatus: string;
  status: string;
  coursesCount: number;
}

export interface AdminCourseItem {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  instructor: {
    name: string;
    email: string;
  };
  category: string;
  price: number;
  currency: string;
  status: string;
  enrollments: number;
  createdAt: string;
}

export interface AdminPaymentItem {
  id: string;
  orderId: string;
  cashfreeReference: string;
  student: {
    name: string;
    email: string;
  };
  course: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  date: string;
}

export interface AdminConsultationItem {
  id: string;
  bookingId: string;
  student: {
    name: string;
    email: string;
  };
  instructor: {
    name: string;
    email: string;
  };
  date: string;
  duration: string;
  fee: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

export interface AdminSupportTicketItem {
  id: string;
  ticketId: string;
  raisedBy: {
    name: string;
    email: string;
    role: string;
  };
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string;
  createdAt: string;
}

export interface AdminReportData {
  overview: {
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    grossRevenue: number;
    netRevenue: number;
    consultationsCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
  }>;
}

export interface AdminNotificationItem {
  id: string;
  type: string;
  recipient: string;
  recipientName: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface AdminProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  adminPermissions: string[];
  phone: string;
  profilePhoto: string | null;
  createdAt: string;
}

export const adminApi = {
  // Page 1: Dashboard
  async getDashboard(params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: AdminDashboardData }> {
    const res = await apiClient.get('/admin/dashboard', { params });
    return res.data;
  },

  // Page 2: Students
  async getStudents(params?: { search?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }): Promise<{
    success: boolean;
    data: {
      students: AdminStudentItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/students', { params });
    return res.data;
  },

  async getStudentById(id: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.get(`/admin/students/${id}`);
    return res.data;
  },

  async updateStudentStatus(id: string, status: string, reason?: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.patch(`/admin/students/${id}/status`, { status, reason });
    return res.data;
  },

  // Page 3: Instructors
  async getInstructors(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      instructors: AdminInstructorItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/instructors', { params });
    return res.data;
  },

  async getInstructorById(id: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.get(`/admin/instructors/${id}`);
    return res.data;
  },

  async updateInstructorStatus(id: string, status: string, reason?: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.patch(`/admin/instructors/${id}/status`, { status, reason });
    return res.data;
  },

  // Page 4: Courses
  async getCourses(params?: { search?: string; status?: string; category?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      courses: AdminCourseItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/courses', { params });
    return res.data;
  },

  async updateCourseStatus(id: string, status: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.patch(`/admin/courses/${id}/status`, { status });
    return res.data;
  },

  // Page 5: Payments
  async getPayments(params?: { search?: string; status?: string; page?: number; limit?: number; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    data: {
      payments: AdminPaymentItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/payments', { params });
    return res.data;
  },

  // Page 6: Consultations
  async getConsultations(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      consultations: AdminConsultationItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/consultations', { params });
    return res.data;
  },

  // Page 7: Support
  async getSupportTickets(params?: { search?: string; status?: string; priority?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      tickets: AdminSupportTicketItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/support-tickets', { params });
    return res.data;
  },

  async updateSupportTicket(id: string, data: { status?: string; priority?: string; assignedTo?: string }): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.patch(`/admin/support-tickets/${id}`, data);
    return res.data;
  },

  // Page 8: Reports
  async getReports(params?: { range?: string }): Promise<{ success: boolean; data: AdminReportData }> {
    const res = await apiClient.get('/admin/reports', { params });
    return res.data;
  },

  // Page 9: Notifications
  async getNotifications(params?: { page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      notifications: AdminNotificationItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
  }> {
    const res = await apiClient.get('/admin/notifications', { params });
    return res.data;
  },

  // Page 10: Settings
  async getProfile(): Promise<{ success: boolean; data: AdminProfileData }> {
    const res = await apiClient.get('/admin/me');
    return res.data;
  },

  async updateProfile(data: { firstName?: string; lastName?: string; phone?: string; profilePhoto?: string }): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.patch('/admin/me', data);
    return res.data;
  },
};
