import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  Clock,
  Award,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Sparkles,
  BookOpen,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  quizzesApi,
  type QuizItem,
  type QuizQuestion,
  type CreateQuizPayload,
  type CreateQuestionPayload,
} from '../../api/quizzes';
import { useToast } from '../../context/ToastContext';

interface InstructorQuizStudioProps {
  courses?: any[];
}

export const InstructorQuizStudio: React.FC<InstructorQuizStudioProps> = ({ courses = [] }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  // Modal States
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [activeQuizForQuestion, setActiveQuizForQuestion] = useState<QuizItem | null>(null);

  // Create Quiz Form
  const [newQuizData, setNewQuizData] = useState<CreateQuizPayload>({
    courseId: '',
    topicId: '',
    title: '',
    description: '',
    passingScore: 70,
    attemptLimit: 3,
    duration: 15,
  });

  // Create Question Form
  const [newQuestionData, setNewQuestionData] = useState<{
    questionText: string;
    type: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    marks: number;
    explanation: string;
  }>({
    questionText: '',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: 'A',
    marks: 1,
    explanation: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await quizzesApi.getInstructorQuizzes(
        selectedCourseFilter !== 'all' ? selectedCourseFilter : undefined
      );
      if (res.success && res.data) {
        setQuizzes(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch instructor quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [selectedCourseFilter]);

  // Set default course for create modal
  useEffect(() => {
    if (courses.length > 0 && !newQuizData.courseId) {
      setNewQuizData((prev) => ({
        ...prev,
        courseId: courses[0]._id || courses[0].id,
      }));
    }
  }, [courses]);

  // Handle Create Quiz Submit
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizData.courseId || !newQuizData.title.trim()) {
      toastError('Please select a course and enter a quiz title.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await quizzesApi.createQuiz(newQuizData);
      if (res.success) {
        toastSuccess('Quiz created successfully!');
        setShowCreateQuizModal(false);
        setNewQuizData({
          courseId: courses[0]?._id || courses[0]?.id || '',
          topicId: '',
          title: '',
          description: '',
          passingScore: 70,
          attemptLimit: 3,
          duration: 15,
        });
        fetchQuizzes();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Question Submit
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizForQuestion) return;

    if (!newQuestionData.questionText.trim()) {
      toastError('Please enter question text.');
      return;
    }

    const validOptions = newQuestionData.options.filter((o) => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      toastError('Please provide at least 2 non-empty options.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateQuestionPayload = {
        questionText: newQuestionData.questionText.trim(),
        type: newQuestionData.type,
        options: newQuestionData.options.map((o) => ({ id: o.id, text: o.text.trim() })),
        correctAnswer: newQuestionData.correctAnswer,
        marks: Number(newQuestionData.marks) || 1,
        explanation: newQuestionData.explanation.trim(),
      };

      const res = await quizzesApi.addQuestion(activeQuizForQuestion._id, payload);
      if (res.success) {
        toastSuccess('Question added to quiz!');
        setShowAddQuestionModal(false);
        setNewQuestionData({
          questionText: '',
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
          ],
          correctAnswer: 'A',
          marks: 1,
          explanation: '',
        });
        fetchQuizzes();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz and its questions?')) return;
    try {
      const res = await quizzesApi.deleteQuiz(quizId);
      if (res.success) {
        toastSuccess('Quiz deleted successfully');
        fetchQuizzes();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  // Handle Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await quizzesApi.deleteQuestion(questionId);
      if (res.success) {
        toastSuccess('Question removed');
        fetchQuizzes();
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
              Assessment Studio
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs text-slate-500 font-bold">{quizzes.length} Quizzes Created</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Quizzes & Question Bank</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create module checkpoints, attach custom questions, and monitor student pass rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Course Filter Dropdown */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz</span>
          </button>
        </div>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading your quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add interactive quizzes to your courses to test student comprehension and issue verifiable certificates.
            </p>
          </div>
          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Create Your First Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const isExpanded = expandedQuizId === quiz._id;

            return (
              <div
                key={quiz._id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                {/* Quiz Summary Header Bar */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {quiz.courseId?.title || 'General Course'}
                      </span>
                      {quiz.topicId?.title && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          Topic: {quiz.topicId.title}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 truncate">{quiz.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{quiz.description || 'No description added.'}</p>
                  </div>

                  {/* Telemetry Pills */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Questions
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {quiz.questions?.length || quiz.totalQuestions || 0}
                      </span>
                    </div>

                    <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        Duration
                      </span>
                      <span className="text-xs font-black text-slate-900">{quiz.duration || 15}m</span>
                    </div>

                    <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Pass Score
                      </span>
                      <span className="text-xs font-black text-emerald-800">{quiz.passingScore || 70}%</span>
                    </div>

                    <div className="px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 block">
                        Student Attempts
                      </span>
                      <span className="text-xs font-black text-indigo-900">{quiz.stats?.totalAttempts || 0}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pl-2">
                      <button
                        type="button"
                        onClick={() => setExpandedQuizId(isExpanded ? null : quiz._id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isExpanded
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Inspect Questions & Answer Key"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide Questions' : `View Questions (${quiz.questions?.length || 0})`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuizForQuestion(quiz);
                          setShowAddQuestionModal(true);
                        }}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition cursor-pointer"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Question Bank Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-5 sm:p-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Questions Deck ({quiz.questions?.length || 0})
                      </h4>
                      <button
                        onClick={() => {
                          setActiveQuizForQuestion(quiz);
                          setShowAddQuestionModal(true);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Question</span>
                      </button>
                    </div>

                    {!quiz.questions || quiz.questions.length === 0 ? (
                      <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                        No questions in this quiz yet. Click <strong>Add Question</strong> to build your question bank.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {quiz.questions.map((q, qIdx) => (
                          <div
                            key={q._id || qIdx}
                            className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                  {qIdx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-900">{q.questionText}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                                  {q.marks || 1} mark
                                </span>
                                <button
                                  onClick={() => handleDeleteQuestion(q._id)}
                                  className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="Delete Question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Options Display */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {(q.options || []).map((opt) => {
                                const isCorrect = q.correctAnswer === opt.id;
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2 rounded-lg border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {opt.id}
                                    </span>
                                    <span className="truncate">{opt.text}</span>
                                    {isCorrect && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Mentor Explanation */}
                            {q.explanation && (
                              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                <strong className="text-slate-700">Explanation: </strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE NEW QUIZ
         ======================================================== */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Create New Course Quiz</h3>
              <button
                onClick={() => setShowCreateQuizModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Course *</label>
                <select
                  value={newQuizData.courseId}
                  onChange={(e) => setNewQuizData((prev) => ({ ...prev, courseId: e.target.value }))}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                >
                  <option value="">Select a Course</option>
                  {courses.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quiz Title *</label>
                <input
                  type="text"
                  value={newQuizData.title}
                  onChange={(e) => setNewQuizData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Module 2: React Hooks & State Mastery"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  value={newQuizData.description}
                  onChange={(e) => setNewQuizData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe what this quiz assesses..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newQuizData.duration}
                    onChange={(e) => setNewQuizData((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Passing %</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newQuizData.passingScore}
                    onChange={(e) => setNewQuizData((prev) => ({ ...prev, passingScore: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attempt Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newQuizData.attemptLimit}
                    onChange={(e) => setNewQuizData((prev) => ({ ...prev, attemptLimit: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateQuizModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD QUESTION TO QUIZ
         ======================================================== */}
      {showAddQuestionModal && activeQuizForQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Question to Quiz</h3>
                <p className="text-[11px] text-slate-500 truncate">{activeQuizForQuestion.title}</p>
              </div>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Prompt *</label>
                <textarea
                  value={newQuestionData.questionText}
                  onChange={(e) => setNewQuestionData((prev) => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Enter the question or problem statement..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Dynamic Options & Select Correct Answer */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  Options & Mark Correct Answer *
                </label>

                {newQuestionData.options.map((opt, idx) => {
                  const isChecked = newQuestionData.correctAnswer === opt.id;

                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewQuestionData((prev) => ({ ...prev, correctAnswer: opt.id }))}
                        className={`w-7 h-7 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Mark as correct answer"
                      >
                        {opt.id}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...newQuestionData.options];
                          updated[idx].text = e.target.value;
                          setNewQuestionData((prev) => ({ ...prev, options: updated }));
                        }}
                        placeholder={`Option ${opt.id} description...`}
                        required={idx < 2}
                        className="flex-1 p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                      />
                      {isChecked && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mentor Explanation / Hint (Optional)</label>
                <textarea
                  value={newQuestionData.explanation}
                  onChange={(e) => setNewQuestionData((prev) => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain why the correct answer is right (shown to students in review)..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
