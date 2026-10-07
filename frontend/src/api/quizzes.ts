import { apiClient as api } from './client';

export interface QuizOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuizQuestion {
  _id: string;
  questionId: string;
  questionText: string;
  type: string;
  options: QuizOption[];
  marks: number;
  order: number;
  correctAnswer?: string; // only returned for instructors/review
  explanation?: string;   // only returned for instructors/review
}

export interface QuizItem {
  _id: string;
  quizId: string;
  courseId: any;
  topicId?: any;
  title: string;
  description?: string;
  passingScore: number;
  attemptLimit: number;
  duration: number; // minutes
  totalQuestions: number;
  isLocked?: boolean;
  myAttemptsCount?: number;
  attemptsRemaining?: number;
  hasPassed?: boolean;
  bestScore?: number | null;
  questions?: QuizQuestion[];
  previousAttempts?: {
    attemptId: string;
    score: number;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
    submittedAt: string;
  }[];
  stats?: {
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    avgScore: number;
  };
}

export interface QuizAttemptStartResponse {
  attemptId: string;
  attemptNumber: number;
  startedAt: string;
  duration: number;
  totalQuestions: number;
}

export interface GradedQuestionBreakdown {
  questionId: string;
  questionText: string;
  options: QuizOption[];
  userSelected: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  marksEarned: number;
  maxMarks: number;
  explanation: string;
}

export interface QuizSubmissionResult {
  attemptId: string;
  score: number;
  totalPossibleMarks: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  submittedAt: string;
  breakdown: GradedQuestionBreakdown[];
  summary: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
  };
}

export interface CreateQuizPayload {
  courseId: string;
  topicId?: string;
  title: string;
  description?: string;
  passingScore?: number;
  attemptLimit?: number;
  duration?: number;
  status?: string;
}

export interface CreateQuestionPayload {
  questionText: string;
  type?: string;
  options: (string | QuizOption)[];
  correctAnswer: string;
  marks?: number;
  explanation?: string;
  order?: number;
}

export const quizzesApi = {
  // Instructor: Get my authored quizzes
  getInstructorQuizzes: async (courseId?: string): Promise<{ success: boolean; data: QuizItem[] }> => {
    const res = await api.get('/quizzes/instructor/my-quizzes', {
      params: courseId ? { courseId } : {},
    });
    return res.data;
  },

  // Instructor: Create Quiz
  createQuiz: async (payload: CreateQuizPayload): Promise<{ success: boolean; data: QuizItem }> => {
    const res = await api.post('/quizzes', payload);
    return res.data;
  },

  // Instructor: Update Quiz
  updateQuiz: async (quizId: string, payload: Partial<CreateQuizPayload>): Promise<{ success: boolean; data: QuizItem }> => {
    const res = await api.put(`/quizzes/${quizId}`, payload);
    return res.data;
  },

  // Instructor: Delete Quiz
  deleteQuiz: async (quizId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/quizzes/${quizId}`);
    return res.data;
  },

  // Instructor: Add Question
  addQuestion: async (quizId: string, payload: CreateQuestionPayload): Promise<{ success: boolean; data: QuizQuestion }> => {
    const res = await api.post(`/quizzes/${quizId}/questions`, payload);
    return res.data;
  },

  // Instructor: Update Question
  updateQuestion: async (questionId: string, payload: Partial<CreateQuestionPayload>): Promise<{ success: boolean; data: QuizQuestion }> => {
    const res = await api.put(`/quizzes/questions/${questionId}`, payload);
    return res.data;
  },

  // Instructor: Delete Question
  deleteQuestion: async (questionId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/quizzes/questions/${questionId}`);
    return res.data;
  },

  // Student / Classroom: Get Quizzes for a Course (Purchase Gated)
  getQuizzesByCourse: async (courseId: string): Promise<{ success: boolean; data: QuizItem[] }> => {
    const res = await api.get(`/quizzes/course/${courseId}`);
    return res.data;
  },

  // Student: Get single Quiz for active playing
  getQuizById: async (quizId: string): Promise<{ success: boolean; data: QuizItem }> => {
    const res = await api.get(`/quizzes/${quizId}`);
    return res.data;
  },

  // Student: Start attempt
  startAttempt: async (quizId: string): Promise<{ success: boolean; data: QuizAttemptStartResponse }> => {
    const res = await api.post(`/quizzes/${quizId}/start`);
    return res.data;
  },

  // Student: Submit answers
  submitQuiz: async (
    quizId: string,
    payload: { attemptId?: string; answers: { questionId: string; selectedOption: string }[] }
  ): Promise<{ success: boolean; data: QuizSubmissionResult }> => {
    const res = await api.post(`/quizzes/${quizId}/submit`, payload);
    return res.data;
  },
};
