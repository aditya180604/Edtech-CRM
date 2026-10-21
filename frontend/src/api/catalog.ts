import { apiClient, cachedGet } from './client';

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
  expertise?: string[];
  country?: string | null;
  rating: number;
  studentCount: number | string;
  courseCount: number;
  isVerified?: boolean;
  courses?: Array<{
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    category: string;
  }>;
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
   * Fetch courses with filtering, search, pagination (cached 30s with in-flight deduplication)
   */
  async getCourses(params?: {
    category?: string;
    level?: string;
    search?: string;
    limit?: number;
    page?: number;
    sort?: string;
  }, options?: { forceRefresh?: boolean }): Promise<CoursesResponse> {
    const res = await cachedGet<{ data?: CoursesResponse }>('/courses', { params }, { ttlMs: 30_000, forceRefresh: options?.forceRefresh });
    return res?.data || { courses: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  },

  /**
   * Fetch single course details by slug or ID (cached 60s)
   */
  async getCourseBySlug(slugOrId: string, options?: { forceRefresh?: boolean }): Promise<CatalogCourseDetail> {
    const res = await cachedGet<{ data?: CatalogCourseDetail }>(`/courses/${slugOrId}`, undefined, { ttlMs: 60_000, forceRefresh: options?.forceRefresh });
    return res?.data as CatalogCourseDetail;
  },

  /**
   * Fetch topics (cached 60s)
   */
  async getTopics(params?: { category?: string; search?: string; limit?: number }, options?: { forceRefresh?: boolean }): Promise<CatalogTopic[]> {
    const res = await cachedGet<{ data?: CatalogTopic[] }>('/topics', { params }, { ttlMs: 60_000, forceRefresh: options?.forceRefresh });
    return res?.data || [];
  },

  /**
   * Fetch webinars (cached 30s)
   */
  async getWebinars(params?: { limit?: number }, options?: { forceRefresh?: boolean }): Promise<CatalogWebinar[]> {
    const res = await cachedGet<{ data?: CatalogWebinar[] }>('/webinars', { params }, { ttlMs: 30_000, forceRefresh: options?.forceRefresh });
    return res?.data || [];
  },

  /**
   * Fetch instructors (cached 60s)
   */
  async getInstructors(params?: { limit?: number }, options?: { forceRefresh?: boolean }): Promise<CatalogInstructor[]> {
    const res = await cachedGet<{ data?: CatalogInstructor[] }>('/instructors', { params }, { ttlMs: 60_000, forceRefresh: options?.forceRefresh });
    return res?.data || [];
  },

  /**
   * Fetch learning paths (cached 60s)
   */
  async getLearningPaths(params?: { limit?: number }, options?: { forceRefresh?: boolean }): Promise<CatalogLearningPath[]> {
    const res = await cachedGet<{ data?: any }>('/learning-paths', { params }, { ttlMs: 60_000, forceRefresh: options?.forceRefresh });
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.learningPaths)) return data.learningPaths;
    return [];
  },

  /**
   * Fetch categories with course counts (cached 60s)
   */
  async getCategories(options?: { forceRefresh?: boolean }): Promise<CatalogCategory[]> {
    const res = await cachedGet<{ data?: CatalogCategory[] }>('/categories', undefined, { ttlMs: 60_000, forceRefresh: options?.forceRefresh });
    return res?.data || [];
  },

  /**
   * Fetch live platform statistics (cached 60s)
   */
  async getPublicStats(options?: { forceRefresh?: boolean }): Promise<CatalogStat[]> {
    const res = await cachedGet<{ data?: CatalogStat[] }>('/stats', undefined, { ttlMs: 60_000, forceRefresh: options?.forceRefresh });
    return res?.data || [];
  },
};
