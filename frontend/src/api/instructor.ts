import { apiClient } from './client';

export interface InstructorDashboardData {
  metrics: {
    totalCourses: number;
    totalTopics: number;
    totalStudents: number;
    averageRating: number;
  };
  charts: {
    studentGrowth: Array<{ month: string; students: number; revenue: number }>;
    studentsByCourse: Array<{ courseId: string; title: string; studentsCount: number; color: string }>;
  };
  myCourses: Array<any>;
  recentActivity: Array<{
    _id: string;
    studentName: string;
    studentAvatar: string | null;
    courseTitle: string;
    action: string;
    timeAgo: string;
  }>;
  upcomingWebinars: Array<any>;
  activeCourse: any;
  syllabus: Array<{
    _id: string;
    title: string;
    order: number;
    topicsCount: number;
    lessonsCount: number;
    duration: string;
    topics: Array<{
      _id: string;
      title: string;
      price: number;
      isFree: boolean;
      duration: number;
      lessons: Array<any>;
    }>;
  }>;
  timestamp: string;
}

export const instructorApi = {
  // 1. Dashboard Telemetry
  async getDashboard(timeframe = '30d', instructorId?: string): Promise<{ success: boolean; data: InstructorDashboardData }> {
    const res = await apiClient.get('/instructor/dashboard', {
      params: { timeframe, ...(instructorId ? { instructorId } : {}) },
    });
    return res.data;
  },

  // 2. Courses
  async getCourses(params?: { status?: string; search?: string; category?: string; page?: number; limit?: number; instructorId?: string }) {
    const res = await apiClient.get('/instructor/courses', { params });
    return res.data;
  },

  async createCourse(payload: any) {
    const res = await apiClient.post('/instructor/courses', payload);
    return res.data;
  },

  async getCourseById(courseId: string, instructorId?: string) {
    const res = await apiClient.get(`/instructor/courses/${courseId}`, {
      params: { ...(instructorId ? { instructorId } : {}) },
    });
    return res.data;
  },

  async updateCourse(courseId: string, payload: any) {
    const res = await apiClient.put(`/instructor/courses/${courseId}`, payload);
    return res.data;
  },

  async deleteCourse(courseId: string) {
    const res = await apiClient.delete(`/instructor/courses/${courseId}`);
    return res.data;
  },

  async updatePrice(courseId: string, payload: { coursePrice: number; currency?: string }) {
    const res = await apiClient.patch(`/instructor/courses/${courseId}/price`, payload);
    return res.data;
  },

  async updateVisibility(courseId: string, payload: { visibility?: string; status?: string }) {
    const res = await apiClient.patch(`/instructor/courses/${courseId}/visibility`, payload);
    return res.data;
  },

  // 3. Curriculum
  async addModule(courseId: string, payload: { title: string; description?: string }) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/modules`, payload);
    return res.data;
  },

  async addTopic(moduleId: string, payload: { title: string; price?: number; isFree?: boolean; duration?: number }) {
    const res = await apiClient.post(`/instructor/modules/${moduleId}/topics`, payload);
    return res.data;
  },

  async addLesson(topicId: string, payload: { title: string; duration?: number }) {
    const res = await apiClient.post(`/instructor/topics/${topicId}/lessons`, payload);
    return res.data;
  },

  // 4. Webinars
  async getWebinars(params?: { status?: string; search?: string; instructorId?: string }) {
    const res = await apiClient.get('/instructor/webinars', { params });
    return res.data;
  },

  async createWebinar(payload: any) {
    const res = await apiClient.post('/instructor/webinars', payload);
    return res.data;
  },

  async updateWebinar(webinarId: string, payload: any) {
    const res = await apiClient.put(`/instructor/webinars/${webinarId}`, payload);
    return res.data;
  },

  async deleteWebinar(webinarId: string) {
    const res = await apiClient.delete(`/instructor/webinars/${webinarId}`);
    return res.data;
  },

  async updateWebinarStatus(webinarId: string, payload: { status: string }) {
    const res = await apiClient.patch(`/instructor/webinars/${webinarId}/status`, payload);
    return res.data;
  },

  // 5. Students
  async getStudents(params?: { status?: string; courseId?: string; search?: string; instructorId?: string }) {
    const res = await apiClient.get('/instructor/students', { params });
    return res.data;
  },

  // 6. Reviews & Ratings
  async getReviews(params?: { rating?: number; search?: string; instructorId?: string }) {
    const res = await apiClient.get('/instructor/reviews', { params });
    return res.data;
  },

  // 7. Q&A
  async getQuestions(params?: { status?: string; search?: string; instructorId?: string }) {
    const res = await apiClient.get('/instructor/questions', { params });
    return res.data;
  },

  async answerQuestion(questionId: string, payload: { answer: string }) {
    const res = await apiClient.post(`/instructor/questions/${questionId}/answer`, payload);
    return res.data;
  },

  // 8. Analytics
  async getAnalytics(params?: { timeframe?: string; instructorId?: string }) {
    const res = await apiClient.get('/instructor/analytics', { params });
    return res.data;
  },

  // 9. Profile & Onboarding
  async getProfile(instructorId?: string) {
    const res = await apiClient.get('/instructor/profile', {
      params: { ...(instructorId ? { instructorId } : {}) },
    });
    return res.data;
  },

  async updateProfile(payload: any) {
    const res = await apiClient.put('/instructor/profile', payload);
    return res.data;
  },

  async completeOnboarding(payload: {
    fullName: string;
    bio: string;
    expertise: string[];
    currentOrganization?: string;
    currentJobTitle?: string;
    isEmployed?: boolean;
    workExperience: string;
    yearsOfExperience: number;
    profilePhoto?: string;
    qualification?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    teachingSubjects?: string[];
    governmentId?: {
      idType: string;
      documentUrl: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    };
  }) {
    const res = await apiClient.post('/instructor/profile/onboarding', payload);
    return res.data;
  },

  async uploadDocument(file: File, documentType: string, title?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (title) formData.append('title', title);
    const res = await apiClient.post('/instructor/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getReadinessReport(): Promise<{
    success: boolean;
    data: {
      isPaid: boolean;
      isScoreLocked: boolean;
      score: number | null;
      scoringRuleVersion: string;
      breakdown?: {
        coreProfile: { score: number; maxScore: number; passed: boolean };
        skillsAndSubjects: { score: number; maxScore: number; passed: boolean };
        experienceAndBio: { score: number; maxScore: number; passed: boolean };
        professionalLinks: { score: number; maxScore: number; passed: boolean };
        governmentId: { score: number; maxScore: number; passed: boolean };
        supportingDocuments: { score: number; maxScore: number; passed: boolean };
      };
      guidance?: {
        missingItems: string[];
        recommendations: string[];
        message?: string;
      };
      recommendations?: string[];
      missingItems?: string[];
    };
  }> {
    const res = await apiClient.get('/instructor/readiness-report');
    return res.data;
  },

  // 10. Course Review & Publishing Workflow (No Publishing Fee)
  async submitForReview(courseId: string) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/submit-for-review`);
    return res.data;
  },

  async publishCourse(courseId: string) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/publish`);
    return res.data;
  },

  // 11. One-Time Instructor Account Registration & Activation Fee (Dynamic Rate)
  async getRegistrationFeeInfo(): Promise<{
    success: boolean;
    data: {
      registrationFeePaid: boolean;
      feeAmount: number;
      currency: string;
      isEnabled: boolean;
      title: string;
      description: string;
      paidAt?: string;
      orderId?: string;
    };
  }> {
    const res = await apiClient.get('/instructor/registration-fee/info');
    return res.data;
  },

  async createRegistrationFeeOrder(returnUrl?: string): Promise<{
    success: boolean;
    data?: {
      orderId?: string;
      paymentSessionId?: string;
      amount?: number;
      currency?: string;
      alreadyPaid?: boolean;
      paymentStatus?: string;
      title?: string;
    };
    orderId?: string;
    paymentSessionId?: string;
    amount?: number;
    currency?: string;
    alreadyPaid?: boolean;
    paymentStatus?: string;
    title?: string;
    message?: string;
  }> {
    const res = await apiClient.post('/instructor/registration-fee/create-order', { returnUrl });
    const payload = res.data?.data || res.data || {};
    return {
      success: res.data?.success ?? true,
      data: payload,
      orderId: payload.orderId || res.data?.orderId,
      paymentSessionId: payload.paymentSessionId || res.data?.paymentSessionId,
      amount: payload.amount || res.data?.amount,
      currency: payload.currency || res.data?.currency,
      alreadyPaid: payload.alreadyPaid || res.data?.alreadyPaid,
      paymentStatus: payload.paymentStatus || res.data?.paymentStatus,
      title: payload.title || res.data?.title,
      message: res.data?.message || payload.message,
    };
  },

  async verifyRegistrationFee(payload: { orderId?: string; cashfreeOrderId?: string }): Promise<{
    success: boolean;
    data?: any;
    paymentStatus: string;
    amount?: number;
    orderId?: string;
    paymentId?: string;
    message?: string;
  }> {
    const res = await apiClient.post('/instructor/registration-fee/verify', payload);
    const data = res.data?.data || res.data || {};
    return {
      success: res.data?.success ?? true,
      data,
      paymentStatus: data.paymentStatus || res.data?.paymentStatus,
      amount: data.amount || res.data?.amount,
      orderId: data.orderId || res.data?.orderId,
      paymentId: data.paymentId || res.data?.paymentId,
      message: res.data?.message || data.message,
    };
  },

  // Deprecated publishing fee helper methods (kept for backwards compatibility)
  async createPublishingFeeOrder(courseId: string, returnUrl?: string): Promise<any> {
    return { success: true, alreadyPaid: true, amount: 0, message: 'Publishing fee is not required.', data: { alreadyPaid: true, amount: 0 } };
  },

  async verifyPublishingFee(courseId: string, payload: { cashfreeOrderId?: string; orderId?: string; simulation?: boolean }): Promise<any> {
    return { success: true, message: 'Publishing fee waived.', data: { paymentStatus: 'SUCCESS', amount: 0 } };
  },

  async getPublishingFeeStatus(courseId: string, orderId?: string, simulation?: boolean): Promise<any> {
    return { success: true, message: 'Publishing fee waived.', data: { paymentStatus: 'SUCCESS', amount: 0 } };
  },
};

