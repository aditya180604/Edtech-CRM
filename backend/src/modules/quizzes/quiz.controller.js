import { QuizService } from './quiz.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class QuizController {
  // Instructor: Create Quiz
  static async createQuiz(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const quiz = await QuizService.createQuiz(instructorId, req.body);
      return ApiResponse.created(res, quiz, 'Quiz created successfully');
    } catch (err) {
      next(err);
    }
  }

  // Instructor: Update Quiz
  static async updateQuiz(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const quiz = await QuizService.updateQuiz(instructorId, req.params.quizId, req.body);
      return ApiResponse.success(res, quiz, 'Quiz updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // Instructor: Delete Quiz
  static async deleteQuiz(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const result = await QuizService.deleteQuiz(instructorId, req.params.quizId);
      return ApiResponse.success(res, result, 'Quiz deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // Instructor: Add Question
  static async addQuestion(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const question = await QuizService.addQuestion(instructorId, req.params.quizId, req.body);
      return ApiResponse.created(res, question, 'Question added successfully');
    } catch (err) {
      next(err);
    }
  }

  // Instructor: Update Question
  static async updateQuestion(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const question = await QuizService.updateQuestion(instructorId, req.params.questionId, req.body);
      return ApiResponse.success(res, question, 'Question updated successfully');
    } catch (err) {
      next(err);
    }
  }

  // Instructor: Delete Question
  static async deleteQuestion(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const result = await QuizService.deleteQuestion(instructorId, req.params.questionId);
      return ApiResponse.success(res, result, 'Question deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  // Instructor: Get My Quizzes
  static async getInstructorQuizzes(req, res, next) {
    try {
      const instructorId = req.user._id || req.user.id;
      const quizzes = await QuizService.getInstructorQuizzes(instructorId, req.query.courseId);
      return ApiResponse.success(res, quizzes, 'Instructor quizzes fetched successfully');
    } catch (err) {
      next(err);
    }
  }

  // Student / Public: Get Quizzes by Course (Purchase-gated)
  static async getQuizzesByCourse(req, res, next) {
    try {
      const quizzes = await QuizService.getQuizzesByCourse(req.params.courseId, req.user);
      return ApiResponse.success(res, quizzes, 'Course quizzes retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // Student: Get Single Quiz for Player
  static async getQuizById(req, res, next) {
    try {
      const quiz = await QuizService.getQuizById(req.params.quizId, req.user);
      return ApiResponse.success(res, quiz, 'Quiz details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  // Student: Start Quiz Attempt
  static async startQuizAttempt(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const attempt = await QuizService.startQuizAttempt(req.params.quizId, userId);
      return ApiResponse.success(res, attempt, 'Quiz attempt started successfully');
    } catch (err) {
      next(err);
    }
  }

  // Student: Submit Quiz Attempt & Grade
  static async submitQuizAttempt(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const result = await QuizService.submitQuizAttempt(req.params.quizId, userId, req.body);
      return ApiResponse.success(res, result, 'Quiz evaluated and submitted successfully');
    } catch (err) {
      next(err);
    }
  }
}
