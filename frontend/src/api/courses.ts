import { apiClient } from './client';
import type { Course } from '../types';

export interface CatalogFilterItem {
  name: string;
  count: number;
}

export interface CourseCatalogResponse {
  courses: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    categories: CatalogFilterItem[];
    levels: CatalogFilterItem[];
  };
}

export interface CourseDetailsResponse {
  isEnrolled?: boolean;
  enrolledTopicsCount?: number;
  totalTopicsCount?: number;
  completedLessonIds?: string[];
  course: Course & {
    description?: string;
    skills?: string[];
    requirements?: string[];
    learningObjectives?: string[];
    studentCount?: string;
    isEnrolled?: boolean;
    enrolledTopicsCount?: number;
    totalTopicsCount?: number;
  };
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
      description?: string;
      price: number;
      isFree: boolean;
      isOwned?: boolean;
      duration: number;
      videoUrl?: string;
      lessons: Array<{
        _id: string;
        title: string;
        duration: number;
        playbackReference?: string;
        videoUrl?: string;
        isLocked?: boolean;
        resources?: Array<{ name: string; type: string; size?: string; url?: string }>;
      }>;
    }>;
  }>;
}

export interface QuestionAnswerItem {
  _id: string;
  answer: string;
  createdAt: string;
  isAccepted?: boolean;
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
}

export interface QuestionItem {
  _id: string;
  question: string;
  createdAt: string;
  status: string;
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  answers: QuestionAnswerItem[];
}

export interface CourseReviewItem {
  _id: string;
  rating: number;
  review?: string;
  createdAt?: string;
}

export interface TopicItem {
  id: string;
  _id: string;
  title: string;
  description?: string;
  price: number;
  duration: number;
  isFree: boolean;
  category: string;
  courseTitle: string;
  courseSlug: string;
  courseId: string;
  moduleTitle: string;
  lessonsCount: number;
  videoUrl?: string;
  hasVideo: boolean;
  thumbnail?: string;
}

export const coursesApi = {
  // 1. Featured Courses for Home Page (Image 4)
  async getFeatured(limit = 8): Promise<{ success: boolean; data: Course[] }> {
    const res = await apiClient.get('/courses/featured', { params: { limit } });
    return res.data;
  },

  // 2. Catalog & Dynamic Sidebar Filters (Image 5)
  async getCatalog(params?: {
    category?: string;
    level?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: CourseCatalogResponse }> {
    const res = await apiClient.get('/courses', { params });
    return res.data;
  },

  // 3. Course Details & Complete Syllabus Hierarchy (Requirement 4 / Image 5)
  async getDetails(slug: string): Promise<{ success: boolean; data: CourseDetailsResponse }> {
    const res = await apiClient.get(`/courses/${slug}`);
    return res.data;
  },

  // 4. Dynamic Standalone Topics for Atomic Topic Purchase (Image 4)
  async getTopics(params?: {
    courseId?: string;
    category?: string;
    search?: string;
  }): Promise<{ success: boolean; data: TopicItem[] }> {
    const res = await apiClient.get('/courses/topics', { params });
    return res.data;
  },

  // 5. Update Lesson Progress
  async updateProgress(
    slug: string,
    body: { lessonId: string; topicId?: string; completed: boolean }
  ): Promise<{ success: boolean; data: { completedLessonIds: string[]; progressPercent: number; isCompleted: boolean } }> {
    const res = await apiClient.post(`/courses/${slug}/progress`, body);
    return res.data;
  },

  // 6. Course Reviews & Ratings
  async getMyReview(slug: string): Promise<{ success: boolean; data: CourseReviewItem | null }> {
    const res = await apiClient.get(`/courses/${slug}/review/my-review`);
    return res.data;
  },

  async submitReview(
    slug: string,
    body: { rating: number; comment?: string; title?: string }
  ): Promise<{ success: boolean; data: CourseReviewItem }> {
    const res = await apiClient.post(`/courses/${slug}/review`, body);
    return res.data;
  },

  // 7. Course Q&A
  async getQuestions(slug: string): Promise<{ success: boolean; data: QuestionItem[] }> {
    const res = await apiClient.get(`/courses/${slug}/qa`);
    return res.data;
  },

  async askQuestion(
    slug: string,
    body: { question: string; lessonId?: string; topicId?: string }
  ): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/courses/${slug}/qa`, body);
    return res.data;
  },

  async answerQuestion(
    slug: string,
    questionId: string,
    body: { answer: string }
  ): Promise<{ success: boolean; data: any }> {
    const res = await apiClient.post(`/courses/${slug}/qa/${questionId}/answer`, body);
    return res.data;
  },
};

