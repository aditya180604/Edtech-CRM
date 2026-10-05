import { apiClient } from './client';

export interface SuperAdminDashboardOverview {
  kpi: {
    gmv: number;
    gmvFormatted: string;
    gmvGrowth: string;
    revenue: number;
    revenueFormatted: string;
    revenueGrowth: string;
    takeRate: string;
    takeRateGrowth: string;
    students: number;
    studentsGrowth: string;
    creators: number;
    creatorsGrowth: string;
    courses: number;
    coursesGrowth: string;
    topics: number;
    topicsGrowth: string;
    orders: number;
    ordersGrowth: string;
    refunds: number;
    payouts: number;
    pendingVerifications?: number;
  };
  charts: {
    gmvRevenueTrend: {
      labels: string[];
      gmv: number[];
      revenue: number[];
    };
    usersByRole: {
      total: number;
      students: number;
      studentsPercent: string;
      instructors: number;
      instructorsPercent: string;
      admins: number;
      adminsPercent: string;
      superAdmins: number;
      superAdminsPercent: string;
      others: number;
      othersPercent: string;
    };
    ordersRefunds: {
      labels: string[];
      orders: number[];
      refunds: number[];
    };
    topCategories: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  };
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    actor: string;
    time: string;
  }>;
  timestamp: string;
}

export interface SuperAdminUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'TERMINATED' | 'INACTIVE';
  joinedDate: string;
  avatar?: string | null;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  department?: string;
  coursesEnrolled?: number;
  coursesCreated?: number;
}

export interface SuperAdminCourse {
  id: string;
  _id: string;
  title: string;
  instructor: string;
  instructorAvatar?: string | null;
  category: string;
  price: number;
  enrolled: number;
  status: 'PUBLISHED' | 'UNDER_REVIEW' | 'DRAFT' | 'ARCHIVED';
  thumbnail: string;
  createdAt: string;
}

export interface SuperAdminOrder {
  id: string;
  orderId: string;
  user: string;
  userEmail: string;
  courseTopic: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
}

export interface SuperAdminRefund {
  id: string;
  refundId: string;
  orderId: string;
  user: string;
  amount: number;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  date: string;
}

export interface SuperAdminPayout {
  id: string;
  payoutId: string;
  instructor: string;
  instructorAvatar?: string | null;
  amount: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
}

export interface SuperAdminInstructorVerification {
  id: string;
  _id: string;
  profileId: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  headline?: string;
  bio: string;
  expertise: string[];
  skills: string[];
  experience?: string;
  workExperience?: string;
  yearsOfExperience?: string;
  currentOrganization?: string;
  isCompleted: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface SuperAdminCountry {
  id: string;
  countryCode: string;
  name: string;
  currencyCode: string;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SuperAdminCurrency {
  id: string;
  name: string;
  currencyCode: string;
  symbol: string;
  exchangeRate: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SuperAdminTax {
  id: string;
  countryCode: string;
  taxName: string;
  taxType: string;
  taxRate: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export const superAdminApi = {
  // 1. Dashboard Overview
  async getDashboard(): Promise<{ success: boolean; data: SuperAdminDashboardOverview }> {
    const res = await apiClient.get('/super-admin/dashboard');
    return res.data;
  },

  // 2. Users Management (Students, Instructors, Admins)
  async getUsers(params?: {
    role?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      users: SuperAdminUser[];
      pagination: { total: number; page: number; limit: number; pages: number };
      counts: { all: number; students: number; instructors: number; admins: number };
    };
  }> {
    const res = await apiClient.get('/super-admin/users', { params });
    return res.data;
  },

  async createUser(data: {
    firstName: string;
    lastName?: string;
    email: string;
    password?: string;
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
    department?: string;
    phone?: string;
  }): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post('/super-admin/users', data);
    return res.data;
  },

  async terminateUser(id: string, reason?: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/super-admin/users/${id}/terminate`, { reason });
    return res.data;
  },

  async reactivateUser(id: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/super-admin/users/${id}/reactivate`);
    return res.data;
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`/super-admin/users/${id}`);
    return res.data;
  },

  // 3. Courses Management
  async getCourses(params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ success: boolean; data: { courses: SuperAdminCourse[]; total: number } }> {
    const res = await apiClient.get('/super-admin/courses', { params });
    return res.data;
  },

  async updateCourseStatus(id: string, status: string): Promise<{ success: boolean }> {
    const res = await apiClient.patch(`/super-admin/courses/${id}/status`, { status });
    return res.data;
  },

  async getApprovalsQueue(): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get('/super-admin/courses/approvals');
    return res.data;
  },

  async getCourseReview(id: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.get(`/super-admin/courses/${id}/review`);
    return res.data;
  },

  async approveCourse(id: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/super-admin/courses/${id}/approve`);
    return res.data;
  },

  async rejectCourse(id: string, reason?: string): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/super-admin/courses/${id}/reject`, { reason });
    return res.data;
  },

  async getInstructorsList(): Promise<{ success: boolean; data: Array<{ id: string; _id: string; name: string; email: string; avatar?: string; phone?: string }> }> {
    const res = await apiClient.get('/super-admin/instructors');
    return res.data;
  },

  async createCourseOnBehalf(payload: any): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post('/super-admin/courses/create-on-behalf', payload);
    return res.data;
  },

  // 4. Orders Management
  async getOrders(params?: { status?: string; search?: string }): Promise<{
    success: boolean;
    data: { orders: SuperAdminOrder[]; total: number };
  }> {
    const res = await apiClient.get('/super-admin/orders', { params });
    return res.data;
  },

  // 5. Refunds Management
  async getRefunds(): Promise<{ success: boolean; data: SuperAdminRefund[] }> {
    const res = await apiClient.get('/super-admin/refunds');
    return res.data;
  },

  async processRefund(id: string, status: 'APPROVED' | 'REJECTED'): Promise<{ success: boolean }> {
    const res = await apiClient.post(`/super-admin/refunds/${id}/process`, { status });
    return res.data;
  },

  // 6. Payouts Management
  async getPayouts(): Promise<{
    success: boolean;
    data: { metrics: { totalPayouts: string; pendingPayouts: string; completedPayouts: string; failedPayouts: string }; payouts: SuperAdminPayout[] };
  }> {
    const res = await apiClient.get('/super-admin/payouts');
    return res.data;
  },

  // 7. Countries Configuration
  async getCountries(): Promise<{ success: boolean; data: SuperAdminCountry[] }> {
    const res = await apiClient.get('/super-admin/countries');
    return res.data;
  },

  async createCountry(data: Omit<SuperAdminCountry, 'id'>): Promise<{ success: boolean; data: SuperAdminCountry }> {
    const res = await apiClient.post('/super-admin/countries', data);
    return res.data;
  },

  async toggleCountry(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.patch(`/super-admin/countries/${id}/toggle`);
    return res.data;
  },

  // 8. Currencies Configuration
  async getCurrencies(): Promise<{ success: boolean; data: SuperAdminCurrency[] }> {
    const res = await apiClient.get('/super-admin/currencies');
    return res.data;
  },

  async createCurrency(data: Omit<SuperAdminCurrency, 'id'>): Promise<{ success: boolean; data: SuperAdminCurrency }> {
    const res = await apiClient.post('/super-admin/currencies', data);
    return res.data;
  },

  async toggleCurrency(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.patch(`/super-admin/currencies/${id}/toggle`);
    return res.data;
  },

  // 9. Taxes Configuration
  async getTaxes(): Promise<{ success: boolean; data: SuperAdminTax[] }> {
    const res = await apiClient.get('/super-admin/taxes');
    return res.data;
  },

  async createTax(data: Omit<SuperAdminTax, 'id'>): Promise<{ success: boolean; data: SuperAdminTax }> {
    const res = await apiClient.post('/super-admin/taxes', data);
    return res.data;
  },

  async toggleTax(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.patch(`/super-admin/taxes/${id}/toggle`);
    return res.data;
  },

  // 10. Infrastructure & Fraud
  async getInfrastructure(): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.get('/super-admin/infrastructure');
    return res.data;
  },

  async getFraud(): Promise<{ success: boolean; data: any[] }> {
    const res = await apiClient.get('/super-admin/fraud');
    return res.data;
  },

  // 11. Instructor Verifications Workflow
  async getInstructorVerifications(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      instructors: SuperAdminInstructorVerification[];
      counts: { all: number; pending: number; approved: number; rejected: number };
      pagination: { total: number; page: number; limit: number; pages: number };
    };
  }> {
    const res = await apiClient.get('/super-admin/instructor-verifications', { params });
    return res.data;
  },

  async getInstructorVerificationById(id: string): Promise<{ success: boolean; data: SuperAdminInstructorVerification }> {
    const res = await apiClient.get(`/super-admin/instructor-verifications/${id}`);
    return res.data;
  },

  async approveInstructorVerification(id: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.post(`/super-admin/instructor-verifications/${id}/approve`);
    return res.data;
  },

  async rejectInstructorVerification(id: string, reason?: string): Promise<{ success: boolean; data: any; message: string }> {
    const res = await apiClient.post(`/super-admin/instructor-verifications/${id}/reject`, { reason });
    return res.data;
  },

  // 12. Platform Fees Ledger & Oversight
  async getPlatformFees(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    data: {
      fees: Array<{
        id: string;
        orderId: string;
        courseId: string;
        courseTitle: string;
        coursePrice: number;
        amount: number;
        currency: string;
        paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'USER_DROPPED' | 'EXPIRED';
        cashfreePaymentId: string;
        paymentMethod: string;
        instructor: {
          id: string;
          name: string;
          email: string;
          avatar?: string;
        };
        createdAt: string;
        paidAt?: string;
        errorMessage?: string;
      }>;
      metrics: {
        totalCollected: number;
        successfulTransactions: number;
        pendingTransactions: number;
        failedTransactions: number;
        totalTransactions: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> {
    const res = await apiClient.get('/super-admin/platform-fees', { params });
    return res.data;
  },
};
