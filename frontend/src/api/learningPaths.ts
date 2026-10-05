import { apiClient } from './client';

export interface LearningPathSummary {
  id: string;
  learningPathId: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  career?: string | null;
  level: string;
  estimatedDuration?: string | null;
  domainsCount: number;
  topicsCount: number;
  thumbnail?: string | null;
  status: string;
  isEnrolled?: boolean;
}

export interface RoadmapTopic {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  duration: number;
  skills: string[];
  order: number;
  isRequired: boolean;
  isRecommended: boolean;
  tutorsCount: number;
  startingPrice: number | null;
  currency: string;
  parentCourse?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  userStatus?: {
    isPurchased: boolean;
    isCompleted: boolean;
    progressPercent: number;
  };
}

export interface RoadmapDomain {
  id: string;
  domainId: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  order: number;
  topicsCount: number;
  progress: number;
  topics: RoadmapTopic[];
}

export interface LearningPathDetail {
  id: string;
  learningPathId: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  career?: string | null;
  level: string;
  estimatedDuration?: string | null;
  totalDomains: number;
  totalTopics: number;
  overallProgress: number;
  isEnrolled?: boolean;
  domains: RoadmapDomain[];
}

export interface TutorOfferingSummary {
  id: string;
  offeringId: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  totalLessons: number;
  skills: string[];
  level: string;
  thumbnail?: string | null;
  instructor: {
    id: string;
    name: string;
    avatar?: string | null;
    headline?: string | null;
    bio?: string | null;
  };
  accessState: 'ACTIVE' | 'NOT_PURCHASED';
  isPurchased: boolean;
}

export interface TopicDetailResponse {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  skills: string[];
  learningObjectives: string[];
  prerequisites: string[];
  course?: {
    id: string;
    title: string;
    slug: string;
    category?: string;
  } | null;
  module?: {
    id: string;
    title: string;
  } | null;
  offeringsCount: number;
  offerings: TutorOfferingSummary[];
}

export interface OfferingLesson {
  id: string;
  lessonId: string;
  title: string;
  order: number;
  duration: number;
  durationDisplay: string;
  isFreePreview: boolean;
  hasAccess: boolean;
  isCompleted: boolean;
  watchedSeconds: number;
  resourcesCount: number;
}

export interface OfferingDetailResponse {
  id: string;
  offeringId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  duration: string;
  totalLessons: number;
  level: string;
  skills: string[];
  learningObjectives: string[];
  prerequisites: string[];
  topic?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  instructor: {
    id: string;
    name: string;
    avatar?: string | null;
    title?: string | null;
    bio?: string | null;
  };
  accessState: 'ACTIVE' | 'NOT_PURCHASED';
  isEntitled: boolean;
  curriculum: OfferingLesson[];
  progress: {
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
  };
}

export interface LessonContentResponse {
  lessonId: string;
  title: string;
  duration: number;
  transcript?: string | null;
  playbackReference: string;
  video?: {
    id: string;
    duration: number;
    thumbnail?: string;
    hlsUrl?: string;
  } | null;
  resources: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    downloadUrl: string;
  }>;
}

export const learningPathsApi = {
  async getLearningPaths(params?: { search?: string; level?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get('/learning-paths', { params });
    return data.data;
  },

  async getLearningPathBySlug(slugOrId: string): Promise<LearningPathDetail> {
    const { data } = await apiClient.get(`/learning-paths/${slugOrId}`);
    return data.data;
  },

  async enrollLearningPath(slugOrId: string) {
    const { data } = await apiClient.post(`/learning-paths/${slugOrId}/enroll`);
    return data.data;
  },

  async getTopicDetail(topicId: string): Promise<TopicDetailResponse> {
    const { data } = await apiClient.get(`/topics/${topicId}`);
    return data.data;
  },

  async getOfferingDetail(offeringId: string): Promise<OfferingDetailResponse> {
    const { data } = await apiClient.get(`/offerings/${offeringId}`);
    return data.data;
  },

  async getOfferingLessonContent(offeringId: string, lessonId: string): Promise<LessonContentResponse> {
    const { data } = await apiClient.get(`/offerings/${offeringId}/lessons/${lessonId}/content`);
    return data.data;
  },

  async purchaseOffering(offeringId: string, payload?: { paymentMethod?: string }) {
    const { data } = await apiClient.post(`/checkout/offering/${offeringId}`, payload || {});
    return data.data;
  },

  async updateOfferingProgress(
    offeringId: string,
    payload: { lessonId: string; watchedSeconds: number; totalSeconds: number; completed?: boolean }
  ) {
    const { data } = await apiClient.post(`/offerings/${offeringId}/progress`, payload);
    return data.data;
  },
};
