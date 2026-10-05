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
  async getDashboard(timeframe = '30d'): Promise<{ success: boolean; data: InstructorDashboardData }> {
    const res = await apiClient.get('/instructor/dashboard', { params: { timeframe } });
    return res.data;
  },

  // 2. Courses
  async getCourses(params?: { status?: string; search?: string; category?: string; page?: number; limit?: number }) {
    const res = await apiClient.get('/instructor/courses', { params });
    return res.data;
  },

  async createCourse(payload: any) {
    const res = await apiClient.post('/instructor/courses', payload);
    return res.data;
  },

  async getCourseById(courseId: string) {
    const res = await apiClient.get(`/instructor/courses/${courseId}`);
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
  async getWebinars(params?: { status?: string; search?: string }) {
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
  async getStudents(params?: { status?: string; courseId?: string; search?: string }) {
    const res = await apiClient.get('/instructor/students', { params });
    return res.data;
  },

  // 6. Reviews & Ratings
  async getReviews(params?: { rating?: number; search?: string }) {
    const res = await apiClient.get('/instructor/reviews', { params });
    return res.data;
  },

  // 7. Q&A
  async getQuestions(params?: { status?: string; search?: string }) {
    const res = await apiClient.get('/instructor/questions', { params });
    return res.data;
  },

  async answerQuestion(questionId: string, payload: { answer: string }) {
    const res = await apiClient.post(`/instructor/questions/${questionId}/answer`, payload);
    return res.data;
  },

  // 8. Analytics
  async getAnalytics(params?: { timeframe?: string }) {
    const res = await apiClient.get('/instructor/analytics', { params });
    return res.data;
  },

  // 9. Profile & Onboarding
  async getProfile() {
    const res = await apiClient.get('/instructor/profile');
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
    workExperience: string;
    yearsOfExperience: number;
    profilePhoto?: string;
    qualification?: string;
  }) {
    const res = await apiClient.post('/instructor/profile/onboarding', payload);
    return res.data;
  },

  // 10. Course Review & Publishing Workflow
  async submitForReview(courseId: string) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/submit-for-review`);
    return res.data;
  },

  async createPublishingFeeOrder(courseId: string, returnUrl?: string) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/publishing-fee/create-order`, { returnUrl });
    return res.data;
  },

  async verifyPublishingFee(courseId: string, payload: { cashfreeOrderId?: string; orderId?: string; simulation?: boolean }) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/publishing-fee/verify`, payload);
    return res.data;
  },

  async getPublishingFeeStatus(courseId: string, orderId?: string, simulation?: boolean) {
    const res = await apiClient.get(`/instructor/courses/${courseId}/publishing-fee/status`, {
      params: { ...(orderId ? { orderId } : {}), ...(simulation ? { simulation: true } : {}) },
    });
    return res.data;
  },

  async publishCourse(courseId: string) {
    const res = await apiClient.post(`/instructor/courses/${courseId}/publish`);
    return res.data;
  },
};
