import { apiClient } from './client';

export interface CatalogCourse {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  instructorName: string;
  instructorAvatar: string | null;
  instructorTitle?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  thumbnail: string | null;
  category: string;
  subcategory?: string;
  level: string;
  language: string;
  skills: string[];
  totalTopics: number;
  totalModules: number;
  rating: number;
  reviewCount: string;
  studentCount: string;
  badge?: string;
}

export interface CourseDetailCurriculumLesson {
  lessonId: string;
  title: string;
  duration: number;
  type: string;
  isFreePreview: boolean;
}

export interface CourseDetailCurriculumTopic {
  topicId: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  duration: number;
  difficulty: string;
  skills: string[];
  isFree: boolean;
  lessons: CourseDetailCurriculumLesson[];
}

export interface CourseDetailCurriculumModule {
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  topics: CourseDetailCurriculumTopic[];
}

export interface CatalogCourseDetail {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail: string | null;
  category: string;
  subcategory?: string;
  level: string;
  language: string;
  price: number;
  currency: string;
  requirements: string[];
  learningObjectives: string[];
  skills: string[];
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    title: string;
    bio: string;
  };
  curriculum: CourseDetailCurriculumModule[];
  rating: number;
  reviewCount: number;
  totalModules: number;
  totalTopics: number;
  totalLessons: number;
}

export interface CatalogTopic {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  difficulty: string;
  duration: string;
  category: string;
  courseTitle: string;
  courseSlug: string;
  icon?: string;
  bgColor?: string;
}

export interface CatalogWebinar {
  id: string;
  webinarId: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  instructorName: string;
  instructorAvatar: string | null;
  date: string;
  duration: string;
  attendeesCount: number;
  price: number;
  currency: string;
  category: string;
  badge: string;
}

export interface CatalogInstructor {
  id: string;
  name: string;
  title: string;
  avatar: string | null;
  bio: string;
  specialization: string;
  rating: number;
  studentCount: string;
  courseCount: number;
}

export interface CatalogLearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  coursesCount: string;
  duration: string;
  level: string;
  skills: string[];
  category: string;
  career: string;
}

export interface CatalogCategory {
  name: string;
  count: string;
  coursesCountNumber: number;
}

export interface CatalogStat {
  value: string;
  label: string;
  icon: string;
}

export interface CoursesResponse {
  courses: CatalogCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const catalogApi = {
  /**
   * Fetch courses with filtering, search, pagination
   */
  async getCourses(params?: {
    category?: string;
    level?: string;
    search?: string;
    limit?: number;
    page?: number;
    sort?: string;
  }): Promise<CoursesResponse> {
    const response = await apiClient.get('/courses', { params });
    return response.data?.data || { courses: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  },

  /**
   * Fetch single course details by slug or ID
   */
  async getCourseBySlug(slugOrId: string): Promise<CatalogCourseDetail> {
    const response = await apiClient.get(`/courses/${slugOrId}`);
    return response.data?.data;
  },

  /**
   * Fetch topics
   */
  async getTopics(params?: { category?: string; search?: string; limit?: number }): Promise<CatalogTopic[]> {
    const response = await apiClient.get('/topics', { params });
    return response.data?.data || [];
  },

  /**
   * Fetch webinars
   */
  async getWebinars(params?: { limit?: number }): Promise<CatalogWebinar[]> {
    const response = await apiClient.get('/webinars', { params });
    return response.data?.data || [];
  },

  /**
   * Fetch instructors
   */
  async getInstructors(params?: { limit?: number }): Promise<CatalogInstructor[]> {
    const response = await apiClient.get('/instructors', { params });
    return response.data?.data || [];
  },

  /**
   * Fetch learning paths
   */
  async getLearningPaths(params?: { limit?: number }): Promise<CatalogLearningPath[]> {
    const response = await apiClient.get('/learning-paths', { params });
    return response.data?.data || [];
  },

  /**
   * Fetch categories with course counts
   */
  async getCategories(): Promise<CatalogCategory[]> {
    const response = await apiClient.get('/categories');
    return response.data?.data || [];
  },

  /**
   * Fetch live platform statistics
   */
  async getPublicStats(): Promise<CatalogStat[]> {
    const response = await apiClient.get('/stats');
    return response.data?.data || [];
  },
};
