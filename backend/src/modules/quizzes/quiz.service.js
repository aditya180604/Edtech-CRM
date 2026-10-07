import mongoose from 'mongoose';
import {
  Quiz,
  Question,
  QuizAttempt,
  Course,
  Topic,
  Entitlement,
  LearningProgress,
} from '../../models/index.js';
import { AppError } from '../../utils/apiResponse.js';

export class QuizService {
  /**
   * Check if a student is entitled to a course or topic
   */
  static async _checkStudentAccess(userId, courseId, topicId = null) {
    if (!userId) return false;

    // Check full course entitlement
    const courseEntitlement = await Entitlement.findOne({
      userId,
      courseId,
      status: 'ACTIVE',
    }).lean();

    if (courseEntitlement) return true;

    // If topicId provided, check topic entitlement
    if (topicId) {
      const topicEntitlement = await Entitlement.findOne({
        userId,
        topicId,
        status: 'ACTIVE',
      }).lean();

      if (topicEntitlement) return true;
    }

    return false;
  }

  /**
   * Instructor: Create a new Quiz
   */
  static async createQuiz(instructorId, data) {
    const { courseId, topicId, title, description, passingScore, attemptLimit, duration, status } = data;

    if (!courseId || !title) {
      throw new AppError('courseId and title are required to create a quiz', 400);
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Verify instructor ownership (unless superadmin or course creator)
    if (course.instructorId && course.instructorId.toString() !== instructorId.toString()) {
      if (course.createdBy && course.createdBy.toString() !== instructorId.toString()) {
        throw new AppError('You are not authorized to create quizzes for this course', 403);
      }
    }

    const quizId = `QUIZ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const quiz = await Quiz.create({
      quizId,
      courseId,
      topicId: topicId || null,
      title: title.trim(),
      description: description?.trim() || '',
      passingScore: Number(passingScore) || 70,
      attemptLimit: Number(attemptLimit) || 3,
      duration: Number(duration) || 15,
      status: status || 'ACTIVE',
      createdBy: instructorId,
      questions: [],
    });

    return quiz;
  }

  /**
   * Instructor: Update Quiz
   */
  static async updateQuiz(instructorId, quizId, updateData) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const allowedFields = ['title', 'description', 'passingScore', 'attemptLimit', 'duration', 'status', 'topicId'];
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        quiz[field] = updateData[field];
      }
    });

    await quiz.save();
    return quiz;
  }

  /**
   * Instructor: Delete Quiz and associated questions
   */
  static async deleteQuiz(instructorId, quizId) {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    await Question.deleteMany({ quizId: quiz._id });
    await QuizAttempt.deleteMany({ quizId: quiz._id });
    await Quiz.findByIdAndDelete(quiz._id);

    return { message: 'Quiz and all associated questions deleted successfully' };
  }

  /**
   * Instructor: Add Question to Quiz
   */
  static async addQuestion(instructorId, quizId, data) {
    const { questionText, type, options, correctAnswer, marks, explanation, order } = data;

    if (!questionText || !options || options.length < 2 || correctAnswer === undefined) {
      throw new AppError('questionText, at least 2 options, and correctAnswer are required', 400);
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    const questionId = `Q-${Date.now()}-${questionCount + 1}`;

    const formattedOptions = options.map((opt, idx) => {
      if (typeof opt === 'string') {
        const id = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'
        return { id, text: opt };
      }
      return opt;
    });

    const newQuestion = await Question.create({
      questionId,
      quizId: quiz._id,
      questionText: questionText.trim(),
      type: type || 'MULTIPLE_CHOICE',
      options: formattedOptions,
      correctAnswer,
      marks: Number(marks) || 1,
      explanation: explanation?.trim() || '',
      order: Number(order) || questionCount + 1,
    });

    quiz.questions.push(newQuestion._id);
    await quiz.save();

    return newQuestion;
  }

  /**
   * Instructor: Update Question
   */
  static async updateQuestion(instructorId, questionId, updateData) {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const allowedFields = ['questionText', 'type', 'options', 'correctAnswer', 'marks', 'explanation', 'order'];
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        question[field] = updateData[field];
      }
    });

    await question.save();
    return question;
  }

  /**
   * Instructor: Delete Question
   */
  static async deleteQuestion(instructorId, questionId) {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const quiz = await Quiz.findById(question.quizId);
    if (quiz) {
      quiz.questions = quiz.questions.filter((id) => id.toString() !== question._id.toString());
      await quiz.save();
    }

    await Question.findByIdAndDelete(question._id);
    return { message: 'Question deleted successfully' };
  }

  /**
   * Instructor: Get all quizzes authored by instructor
   */
  static async getInstructorQuizzes(instructorId, courseId = null) {
    const query = { createdBy: instructorId };
    if (courseId) {
      query.courseId = courseId;
    }

    const quizzes = await Quiz.find(query)
      .populate('courseId', 'title slug thumbnail')
      .populate('topicId', 'title')
      .populate('questions')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch attempt stats for each quiz
    const quizIds = quizzes.map((q) => q._id);
    const attempts = await QuizAttempt.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      {
        $group: {
          _id: '$quizId',
          totalAttempts: { $sum: 1 },
          passedAttempts: { $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] } },
          avgScore: { $avg: '$percentage' },
        },
      },
    ]);

    const attemptsMap = new Map();
    attempts.forEach((a) => {
      attemptsMap.set(a._id.toString(), a);
    });

    return quizzes.map((q) => {
      const stats = attemptsMap.get(q._id.toString()) || {
        totalAttempts: 0,
        passedAttempts: 0,
        avgScore: 0,
      };

      return {
        ...q,
        stats: {
          totalAttempts: stats.totalAttempts,
          passedAttempts: stats.passedAttempts,
          passRate: stats.totalAttempts > 0 ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100) : 0,
          avgScore: Math.round(stats.avgScore || 0),
        },
      };
    });
  }

  /**
   * Student: Get Quizzes for a Course (Purchase-Gated Access Control)
   */
  static async getQuizzesByCourse(courseId, user) {
    const course = await Course.findById(courseId).lean();
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    const userId = user?._id || user?.id;
    const userRole = user?.role;
    const isInstructorOrAdmin = userRole === 'INSTRUCTOR' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    // Verify purchase entitlement for students
    let isEntitled = isInstructorOrAdmin;
    if (!isEntitled && userId) {
      isEntitled = await this._checkStudentAccess(userId, courseId);
    }

    const quizzes = await Quiz.find({
      courseId,
      status: 'ACTIVE',
    })
      .populate('topicId', 'title')
      .populate({
        path: 'questions',
        select: isInstructorOrAdmin ? '' : '-correctAnswer -explanation',
      })
      .sort({ createdAt: 1 })
      .lean();

    // Attach student attempts if authenticated
    let studentAttempts = [];
    if (userId) {
      studentAttempts = await QuizAttempt.find({
        userId,
        quizId: { $in: quizzes.map((q) => q._id) },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    return quizzes.map((q) => {
      const myAttempts = studentAttempts.filter((a) => a.quizId.toString() === q._id.toString());
      const bestAttempt = myAttempts.reduce(
        (best, curr) => (curr.percentage > (best?.percentage || -1) ? curr : best),
        null
      );

      return {
        _id: q._id,
        quizId: q.quizId,
        courseId: q.courseId,
        topicId: q.topicId,
        title: q.title,
        description: q.description,
        passingScore: q.passingScore,
        attemptLimit: q.attemptLimit,
        duration: q.duration,
        totalQuestions: q.questions?.length || 0,
        isLocked: !isEntitled,
        myAttemptsCount: myAttempts.length,
        attemptsRemaining: Math.max(0, (q.attemptLimit || 3) - myAttempts.length),
        hasPassed: bestAttempt?.passed || false,
        bestScore: bestAttempt?.percentage ?? null,
        questions: isEntitled ? q.questions : [],
      };
    });
  }

  /**
   * Student: Get single Quiz for active playing
   */
  static async getQuizById(quizId, user) {
    const quiz = await Quiz.findById(quizId)
      .populate('courseId', 'title slug thumbnail')
      .populate('topicId', 'title')
      .populate('questions')
      .lean();

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const userId = user?._id || user?.id;
    const userRole = user?.role;
    const isInstructorOrAdmin =
      userRole === 'INSTRUCTOR' ||
      userRole === 'ADMIN' ||
      userRole === 'SUPER_ADMIN' ||
      quiz.createdBy?.toString() === userId?.toString();

    // Check purchase entitlement
    if (!isInstructorOrAdmin) {
      const isEntitled = await this._checkStudentAccess(userId, quiz.courseId?._id || quiz.courseId, quiz.topicId?._id);
      if (!isEntitled) {
        throw new AppError('🔒 Access Locked: You must purchase this course or topic to unlock and take this quiz.', 403);
      }
    }

    // Fetch user previous attempts
    let previousAttempts = [];
    if (userId) {
      previousAttempts = await QuizAttempt.find({ quizId: quiz._id, userId }).sort({ createdAt: -1 }).lean();
    }

    const attemptsUsed = previousAttempts.length;
    const attemptLimit = quiz.attemptLimit || 3;
    const bestAttempt = previousAttempts.reduce(
      (best, curr) => (curr.percentage > (best?.percentage || -1) ? curr : best),
      null
    );

    // Sanitize questions for active taking (hide answers)
    const sanitizedQuestions = (quiz.questions || []).map((q) => ({
      _id: q._id,
      questionId: q.questionId,
      questionText: q.questionText,
      type: q.type || 'MULTIPLE_CHOICE',
      options: q.options || [],
      marks: q.marks || 1,
      order: q.order || 1,
      ...(isInstructorOrAdmin
        ? { correctAnswer: q.correctAnswer, explanation: q.explanation }
        : {}),
    }));

    return {
      _id: quiz._id,
      quizId: quiz.quizId,
      title: quiz.title,
      description: quiz.description,
      courseId: quiz.courseId,
      topicId: quiz.topicId,
      passingScore: quiz.passingScore || 70,
      attemptLimit,
      duration: quiz.duration || 15,
      questions: sanitizedQuestions,
      totalQuestions: sanitizedQuestions.length,
      attemptsUsed,
      attemptsRemaining: Math.max(0, attemptLimit - attemptsUsed),
      hasPassed: bestAttempt?.passed || false,
      bestScore: bestAttempt?.percentage ?? null,
      previousAttempts: previousAttempts.map((a) => ({
        attemptId: a.attemptId || a._id,
        score: a.score,
        percentage: a.percentage,
        passed: a.passed,
        attemptNumber: a.attemptNumber,
        submittedAt: a.submittedAt || a.createdAt,
      })),
    };
  }

  /**
   * Student: Start a Quiz Attempt
   */
  static async startQuizAttempt(quizId, userId) {
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    // Check attempt limit
    const existingAttemptsCount = await QuizAttempt.countDocuments({ quizId: quiz._id, userId });
    const attemptLimit = quiz.attemptLimit || 3;

    if (existingAttemptsCount >= attemptLimit) {
      throw new AppError(`You have reached the maximum attempt limit (${attemptLimit}) for this quiz.`, 400);
    }

    const attemptId = `ATT-${Date.now()}-${existingAttemptsCount + 1}`;

    const newAttempt = await QuizAttempt.create({
      attemptId,
      quizId: quiz._id,
      userId,
      answers: [],
      score: 0,
      percentage: 0,
      passed: false,
      attemptNumber: existingAttemptsCount + 1,
      startedAt: new Date(),
    });

    return {
      attemptId: newAttempt.attemptId,
      attemptNumber: newAttempt.attemptNumber,
      startedAt: newAttempt.startedAt,
      duration: quiz.duration,
      totalQuestions: quiz.questions?.length || 0,
    };
  }

  /**
   * Student: Submit Answers & Grade Quiz
   */
  static async submitQuizAttempt(quizId, userId, payload) {
    const { attemptId, answers = [] } = payload;

    const quiz = await Quiz.findById(quizId).populate('questions').lean();
    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    const questionsMap = new Map();
    let totalPossibleMarks = 0;

    quiz.questions.forEach((q) => {
      questionsMap.set(q._id.toString(), q);
      totalPossibleMarks += q.marks || 1;
    });

    if (totalPossibleMarks === 0) totalPossibleMarks = 1;

    let earnedScore = 0;
    const gradedBreakdown = [];

    const answersMap = new Map();
    answers.forEach((ans) => {
      answersMap.set(ans.questionId?.toString(), ans.selectedOption);
    });

    quiz.questions.forEach((q) => {
      const qId = q._id.toString();
      const userChoice = answersMap.get(qId);
      const isCorrect =
        userChoice !== undefined &&
        userChoice !== null &&
        String(userChoice).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase();

      const marksEarned = isCorrect ? q.marks || 1 : 0;
      earnedScore += marksEarned;

      gradedBreakdown.push({
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        userSelected: userChoice ?? null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marksEarned,
        maxMarks: q.marks || 1,
        explanation: q.explanation || 'Correct answer verified by instructor.',
      });
    });

    const percentage = Math.round((earnedScore / totalPossibleMarks) * 100);
    const passingScore = quiz.passingScore || 70;
    const passed = percentage >= passingScore;

    let attempt;
    if (attemptId) {
      attempt = await QuizAttempt.findOne({ attemptId, userId });
    }

    if (!attempt) {
      const currentCount = await QuizAttempt.countDocuments({ quizId: quiz._id, userId });
      attempt = new QuizAttempt({
        attemptId: attemptId || `ATT-${Date.now()}-${currentCount + 1}`,
        quizId: quiz._id,
        userId,
        attemptNumber: currentCount + 1,
      });
    }

    attempt.answers = answers;
    attempt.score = earnedScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.submittedAt = new Date();
    attempt.set('status', 'COMPLETED', { strict: false });
    attempt.set('completedAt', new Date(), { strict: false });

    await attempt.save();

    if (quiz.courseId) {
      await LearningProgress.findOneAndUpdate(
        { userId, courseId: quiz.courseId },
        {
          $set: { lastActivityDate: new Date() },
          $addToSet: { completedQuizzes: quiz._id },
        },
        { upsert: true, new: true }
      ).catch(() => {});
    }

    return {
      attemptId: attempt.attemptId,
      score: earnedScore,
      totalPossibleMarks,
      percentage,
      passingScore,
      passed,
      submittedAt: attempt.submittedAt,
      breakdown: gradedBreakdown,
      summary: {
        totalQuestions: quiz.questions.length,
        correctCount: gradedBreakdown.filter((g) => g.isCorrect).length,
        incorrectCount: gradedBreakdown.filter((g) => !g.isCorrect && g.userSelected !== null).length,
        unansweredCount: gradedBreakdown.filter((g) => g.userSelected === null).length,
      },
    };
  }
}
