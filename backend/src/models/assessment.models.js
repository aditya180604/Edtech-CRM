import mongoose from 'mongoose';

// ==========================================
// 10. Quiz Model (Collection: quizzes)
// ==========================================
const quizSchema = new mongoose.Schema(
  {
    quizId: { type: String, unique: true, sparse: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    passingScore: { type: Number, default: 70 }, // percentage or points
    attemptLimit: { type: Number, default: 3 },
    duration: { type: Number, default: 0 }, // minutes
    status: { type: String, default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'quizzes',
    timestamps: true,
  }
);

export const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

// ==========================================
// 11. Question Model (Collection: questions) - Quiz Question
// ==========================================
const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, unique: true, sparse: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    questionText: { type: String, required: true },
    type: { type: String, default: 'MULTIPLE_CHOICE' },
    options: { type: [mongoose.Schema.Types.Mixed], default: [] },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
    marks: { type: Number, default: 1 },
    explanation: { type: String },
    order: { type: Number, default: 1 },
  },
  {
    collection: 'questions',
    timestamps: true,
  }
);

questionSchema.index({ quizId: 1, order: 1 });

export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// ==========================================
// 12. QuizAttempt Model (Collection: quiz_attempts)
// ==========================================
const quizAttemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String, unique: true, sparse: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    attemptNumber: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  {
    collection: 'quiz_attempts',
    timestamps: true,
  }
);

quizAttemptSchema.index({ userId: 1, quizId: 1 });

export const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);

// ==========================================
// 13. Assignment Model (Collection: assignments)
// ==========================================
const assignmentSchema = new mongoose.Schema(
  {
    assignmentId: { type: String, unique: true, sparse: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', index: true },
    title: { type: String, required: true },
    description: { type: String },
    instructions: { type: String },
    deadline: { type: Date },
    maxMarks: { type: Number, default: 100 },
    status: { type: String, default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'assignments',
    timestamps: true,
  }
);

export const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

// ==========================================
// 14. AssignmentSubmission Model (Collection: assignment_submissions)
// ==========================================
const assignmentSubmissionSchema = new mongoose.Schema(
  {
    submissionId: { type: String, unique: true, sparse: true, index: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String },
    files: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'SUBMITTED' }, // SUBMITTED, GRADED, REJECTED
    marks: { type: Number },
    feedback: { type: String },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
  },
  {
    collection: 'assignment_submissions',
    timestamps: true,
  }
);

assignmentSubmissionSchema.index({ assignmentId: 1, userId: 1 });

export const AssignmentSubmission =
  mongoose.models.AssignmentSubmission || mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
