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

export const aiApi = {
  /**
   * Ask In-Classroom AI Tutor
   */
  async askTutor(payload: AskTutorPayload): Promise<{ success: boolean; data: AskTutorResponse; message?: string }> {
    const response = await apiClient.post('/ai/tutor', payload);
    return response.data;
  },
};
