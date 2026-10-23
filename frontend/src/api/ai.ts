import { apiClient } from './client';

export interface AskTutorPayload {
  question?: string;
  courseTitle?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  codeSnippet?: string;
  promptType?: 'EXPLAIN_BEGINNER' | 'CODE_EXAMPLE' | 'QUIZ_ME' | 'COMMON_PITFALLS' | 'SUMMARY' | 'CUSTOM_QUERY';
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface AskTutorResponse {
  reply: string;
  lessonContext: {
    courseTitle: string;
    moduleTitle: string;
    lessonTitle: string;
  };
  promptType: string;
  timestamp: string;
}

export interface ParsedTopic {
  title: string;
  description: string;
  duration: number;
  videoUrl: string;
  price: number;
  isFree: boolean;
}

export interface ParsedModule {
  title: string;
  topics: ParsedTopic[];
}

export interface ParseCurriculumResponse {
  courseTitle?: string;
  courseDescription?: string;
  price?: number;
  duration?: number;
  modules: ParsedModule[];
  stats?: {
    totalModules: number;
    totalTopics: number;
    totalDurationMinutes: number;
  };
}

export const aiApi = {
  /**
   * Ask In-Classroom AI Tutor
   */
  async askTutor(payload: AskTutorPayload): Promise<{ success: boolean; data: AskTutorResponse; message?: string }> {
    const response = await apiClient.post('/ai/tutor', payload);
    return response.data;
  },

  /**
   * Parse Course Curriculum from raw text or uploaded document (PDF/Word/Text)
   */
  async parseCurriculum(payload: {
    text?: string;
    fileDataUrl?: string;
    fileName?: string;
    fileType?: string;
  }): Promise<{ success: boolean; data: ParseCurriculumResponse; message?: string }> {
    const response = await apiClient.post('/ai/parse-curriculum', payload);
    return response.data;
  },
};
