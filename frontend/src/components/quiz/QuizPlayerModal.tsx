import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  BookOpen,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { quizzesApi, type QuizItem, type QuizSubmissionResult } from '../../api/quizzes';
import { useToast } from '../../context/ToastContext';

interface QuizPlayerModalProps {
  quizId: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizCompleted?: (result: QuizSubmissionResult) => void;
}

type QuizPhase = 'LOBBY' | 'PLAYING' | 'SUBMITTING' | 'RESULT';

export const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  quizId,
  isOpen,
  onClose,
  onQuizCompleted,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [phase, setPhase] = useState<QuizPhase>('LOBBY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizItem | null>(null);

  // Active quiz taking state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}); // { [questionId]: 'A' }
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const timerRef = useRef<any>(null);

  // Fetch Quiz details when modal opens
  useEffect(() => {
    if (!isOpen || !quizId) return;

    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        setPhase('LOBBY');
        setUserAnswers({});
        setFlaggedQuestions({});
        setSubmissionResult(null);

        const res = await quizzesApi.getQuizById(quizId);
        if (res.success && res.data) {
          setQuiz(res.data);
          setSecondsRemaining((res.data.duration || 15) * 60);
        } else {
          setError('Unable to load quiz details.');
        }
      } catch (err: any) {
        console.error('Failed to load quiz:', err);
        setError(err.response?.data?.message || 'Access restricted. Please enroll in this course to take this quiz.');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [isOpen, quizId]);

  // Live Timer Countdown
  useEffect(() => {
    if (phase === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Auto submit when time expires
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, userAnswers, attemptId]);

  const handleStartQuiz = async () => {
    if (!quiz) return;
    try {
      setLoading(true);
      const res = await quizzesApi.startAttempt(quiz._id);
      if (res.success && res.data) {
        setAttemptId(res.data.attemptId);
        setSecondsRemaining((res.data.duration || quiz.duration || 15) * 60);
        setCurrentIndex(0);
        setUserAnswers({});
        setFlaggedQuestions({});
        setPhase('PLAYING');
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to start quiz attempt');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz(true);
  };

  const handleSubmitQuiz = async (isAuto = false) => {
    if (!quiz) return;
    try {
      setPhase('SUBMITTING');
      setShowSubmitConfirm(false);

      const formattedAnswers = Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const res = await quizzesApi.submitQuiz(quiz._id, {
        attemptId: attemptId || undefined,
        answers: formattedAnswers,
      });

      if (res.success && res.data) {
        setSubmissionResult(res.data);
        setPhase('RESULT');
        if (res.data.passed) {
          toastSuccess(`🎉 Passed! You scored ${res.data.percentage}%`);
        } else {
          toastError(`Scored ${res.data.percentage}%. Passing score is ${res.data.passingScore}%.`);
        }
        if (onQuizCompleted) {
          onQuizCompleted(res.data);
        }
      }
    } catch (err: any) {
      console.error('Quiz submission failed:', err);
      toastError(err.response?.data?.message || 'Failed to submit quiz.');
      setPhase('PLAYING');
    }
  };

  const currentQuestion = useMemo(() => {
    if (!quiz?.questions || quiz.questions.length === 0) return null;
    return quiz.questions[currentIndex];
  }, [quiz, currentIndex]);

  const unansweredCount = useMemo(() => {
    if (!quiz?.questions) return 0;
    return quiz.questions.length - Object.keys(userAnswers).length;
  }, [quiz, userAnswers]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ========================================================
            MODAL HEADER
           ======================================================== */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold truncate">
                {quiz?.title || 'Interactive Assessment'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                {quiz?.courseId?.title || 'Course Mastery Checkpoint'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {phase === 'PLAYING' && (
              <div
                className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono font-bold text-xs ${
                  secondsRemaining < 60
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            MODAL BODY BY PHASE
           ======================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading Assessment Arena...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Quiz Access Locked</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Back to Course
              </button>
            </div>
          ) : phase === 'LOBBY' && quiz ? (
            /* ========================================================
               PHASE 1: PRE-QUIZ LOBBY
               ======================================================== */
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black rounded-full uppercase tracking-wider">
                  Knowledge Checkpoint
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{quiz.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {quiz.description ||
                    'Test your understanding of core concepts covered in this module. Reach the passing threshold to earn skill progress and streak points.'}
                </p>
              </div>

              {/* Stat Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</span>
                  <p className="text-lg font-black text-slate-900">{quiz.totalQuestions || quiz.questions?.length || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Limit</span>
                  <p className="text-lg font-black text-slate-900">{quiz.duration || 15} Mins</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Passing Score</span>
                  <p className="text-lg font-black text-emerald-600">{quiz.passingScore || 70}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
                  <p className="text-lg font-black text-indigo-600">{quiz.attemptsRemaining ?? 3} Left</p>
                </div>
              </div>

              {/* Best Attempt Banner */}
              {quiz.bestScore !== null && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        {quiz.hasPassed ? 'You previously passed this quiz!' : 'Previous Attempt Recorded'}
                      </p>
                      <p className="text-[11px] text-emerald-700">Best Score: {quiz.bestScore}%</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
                    {quiz.bestScore}%
                  </span>
                </div>
              )}

              {/* Key Exam Rules */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <h4 className="font-bold text-slate-800">Quiz Guidelines:</h4>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  <li>The timer starts immediately upon clicking <strong>Start Quiz</strong>.</li>
                  <li>You can flag questions to review before final submission.</li>
                  <li>If the countdown expires, your selected answers are automatically submitted.</li>
                  <li>Passing this quiz extends your daily learning streak.</li>
                </ul>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={(quiz.attemptsRemaining ?? 3) <= 0}
                  className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Start Quiz</span>
                </button>
              </div>
            </div>
          ) : phase === 'PLAYING' && quiz && currentQuestion ? (
            /* ========================================================
               PHASE 2: ACTIVE PLAYING ARENA
               ======================================================== */
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Question Navigation Palette */}
              <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-100">
                {(quiz.questions || []).map((q, idx) => {
                  const isAnswered = !!userAnswers[q._id];
                  const isFlagged = !!flaggedQuestions[q._id];
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q._id || idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400 ring-offset-1'
                          : isFlagged
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Question {currentIndex + 1} of {quiz.questions?.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQuestion._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      flaggedQuestions[currentQuestion._id]
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestion._id] ? 'fill-amber-500' : ''}`} />
                    <span>{flaggedQuestions[currentQuestion._id] ? 'Flagged' : 'Flag for Review'}</span>
                  </button>
                </div>

                <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.questionText}
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = userAnswers[currentQuestion._id] === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQuestion._id, opt.id)}
                        className={`p-4 rounded-xl border transition flex items-center gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 text-slate-500'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation & Submit Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-xl text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-3">
                  {currentIndex < (quiz.questions?.length || 1) - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitConfirm(true)}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : phase === 'RESULT' && submissionResult ? (
            /* ========================================================
               PHASE 3: SCORECARD & DETAILED QUESTION BREAKDOWN
               ======================================================== */
            <div className="space-y-8 max-w-3xl mx-auto py-2">
              {/* Top Celebration / Score Banner */}
              <div
                className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 ${
                  submissionResult.passed
                    ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200'
                    : 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-200'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                    submissionResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {submissionResult.passed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    {submissionResult.passed ? '🎉 Congratulations! You Passed!' : 'Needs Improvement!'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {submissionResult.passed
                      ? 'You have successfully demonstrated mastery of this module.'
                      : `You scored ${submissionResult.percentage}%. The passing threshold is ${submissionResult.passingScore}%.`}
                  </p>
                </div>

                <div className="inline-flex items-center gap-6 pt-2">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</span>
                    <p className="text-2xl font-black text-indigo-600">{submissionResult.percentage}%</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Correct</span>
                    <p className="text-2xl font-black text-emerald-600">{submissionResult.summary.correctCount}</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Questions</span>
                    <p className="text-2xl font-black text-slate-800">{submissionResult.summary.totalQuestions}</p>
                  </div>
                </div>
              </div>

              {/* Question-by-Question Graded Review */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900">Question Review & Explanations</h4>

                <div className="space-y-4">
                  {submissionResult.breakdown.map((item, idx) => (
                    <div
                      key={item.questionId || idx}
                      className={`p-5 rounded-2xl border ${
                        item.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-bold text-slate-500">Question {idx + 1}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {item.isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-slate-900 mb-3">{item.questionText}</p>

                      <div className="space-y-1.5">
                        {item.options.map((opt) => {
                          const isUserChoice = item.userSelected === opt.id;
                          const isCorrectChoice = item.correctAnswer === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                                isCorrectChoice
                                  ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                                  : isUserChoice && !item.isCorrect
                                  ? 'bg-red-100/70 border-red-300 font-bold text-red-900'
                                  : 'bg-white/60 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>
                                <strong>{opt.id}.</strong> {opt.text}
                              </span>
                              {isCorrectChoice ? (
                                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">
                                  Correct Answer
                                </span>
                              ) : isUserChoice ? (
                                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-black">
                                  Your Choice
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Instructor Explanation */}
                      {item.explanation && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                          <strong className="text-slate-800 block mb-0.5">💡 Mentor Explanation:</strong>
                          {item.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Close & Continue Learning
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* ========================================================
            SUBMIT CONFIRMATION MODAL POPUP
           ======================================================== */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Ready to Submit Quiz?</h3>
                <p className="text-xs text-slate-500">
                  {unansweredCount > 0
                    ? `You still have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
                    : 'You have answered all questions. Submit to view your instant evaluation.'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Review Answers
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitQuiz(false)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
