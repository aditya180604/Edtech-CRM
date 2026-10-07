import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  coursesApi,
  type CourseDetailsResponse,
  type QuestionItem,
  type CourseReviewItem,
} from '../api/courses';
import { featuredCoursesData } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AiLearningCopilotTab } from '../components/classroom/AiLearningCopilotTab';
import { quizzesApi, type QuizItem } from '../api/quizzes';
import { QuizPlayerModal } from '../components/quiz/QuizPlayerModal';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Video,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  MonitorSmartphone,
  Award,
  ShieldCheck,
  GraduationCap,
  X,
  FileText,
  PlayCircle,
  Clock,
  Sparkles,
  Lock,
  Cpu,
  Laptop,
  Check,
  Play,
  Users,
  Star,
  MessageSquare,
  Send,
  HelpCircle,
  Download,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { success } = useToast();
  const [courseData, setCourseData] = useState<CourseDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(true);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  // Active Classroom Tabs: 'overview' | 'qa' | 'reviews' | 'ai_copilot'
  const [classroomTab, setClassroomTab] = useState<'overview' | 'qa' | 'reviews' | 'ai_copilot'>('overview');

  // Rating & Review State
  const [userRating, setUserRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [existingReview, setExistingReview] = useState<CourseReviewItem | null>(null);

  // Q&A State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Video Player & Restricted Access Paywall Modals
  const [activeVideoModal, setActiveVideoModal] = useState<{ title: string; url: string } | null>(null);
  const [lockedLessonModal, setLockedLessonModal] = useState<{
    title: string;
    topicTitle: string;
    topicId?: string;
    topicPrice: number;
    duration: number;
  } | null>(null);
  const [courseQuizzes, setCourseQuizzes] = useState<QuizItem[]>([]);
  const [activeQuizModalId, setActiveQuizModalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await coursesApi.getDetails(slug);
        if (res.success && res.data) {
          setCourseData(res.data);
          const cId = res.data.course?._id || res.data.course?.id;
          if (cId) {
            quizzesApi.getQuizzesByCourse(cId).then((qRes) => {
              if (qRes.success && qRes.data) {
                setCourseQuizzes(qRes.data);
              }
            }).catch(() => {});
          }
          if (Array.isArray(res.data.completedLessonIds) && res.data.completedLessonIds.length > 0) {
            setCompletedLessonIds(res.data.completedLessonIds);
            try {
              localStorage.setItem(`edtech_course_progress_${slug}`, JSON.stringify(res.data.completedLessonIds));
            } catch {}
          }
          // Expand all modules by default matching layout
          const initialExp: Record<string, boolean> = {};
          (res.data.syllabus || []).forEach((m) => {
            initialExp[m._id] = true;
          });
          setExpandedModules(initialExp);
        }
      } catch (err) {
        console.warn('Fallback course details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  const fallbackCourse =
    featuredCoursesData.find((c) => c.slug === slug) || featuredCoursesData[0];

  const course: any = courseData?.course || fallbackCourse;
  const syllabus = courseData?.syllabus || [
    {
      _id: 'm1',
      title: 'Module 1: Introduction & Fundamentals',
      order: 1,
      topicsCount: 2,
      lessonsCount: 2,
      duration: '1h 0m',
      topics: [
        {
          _id: 't1',
          title: 'Welcome to the Course & Environment Setup',
          description: 'Getting your IDE and tools ready.',
          price: 299,
          isFree: true,
          duration: 20,
          videoUrl: '',
          lessons: [
            {
              _id: 'l1',
              title: 'Overview & Prerequisites',
              duration: 10,
              videoUrl: '',
            },
          ],
        },
      ],
    },
  ];

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExp: Record<string, boolean> = {};
    syllabus.forEach((m) => {
      newExp[m._id] = nextState;
    });
    setExpandedModules(newExp);
  };

  const totalLessons = syllabus.reduce(
    (acc, m) =>
      acc +
      ((m as any).lessons?.length ||
        m.lessonsCount ||
        (m.topics || []).reduce((tAcc: number, t: any) => tAcc + (t.lessons?.length || 1), 0)),
    0
  ) || syllabus.length;

  const totalTopics =
    syllabus.reduce((acc, m) => acc + (m.topics?.length || m.topicsCount || 0), 0) ||
    syllabus.length;

  // Utility to reliably normalize and split array / comma / newline list values
  const normalizeList = (raw: any): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.flatMap((item) =>
        typeof item === 'string'
          ? item.split(/\r?\n|,/).map((s) => s.replace(/^[\s\d+.\-•*–—>)\]]+/, '').trim()).filter(Boolean)
          : [String(item)]
      );
    }
    if (typeof raw === 'string') {
      return raw.split(/\r?\n|,/).map((s) => s.replace(/^[\s\d+.\-•*–—>)\]]+/, '').trim()).filter(Boolean);
    }
    return [];
  };

  const parsedRequirements = normalizeList(course.requirements);
  const parsedHardwareReqs = normalizeList(course.hardwareRequirements);
  const parsedSoftwareReqs = normalizeList(course.softwareRequirements);
  const parsedRequiredAccounts = normalizeList(course.requiredAccounts);
  const parsedFoundations = normalizeList(course.foundationalConcepts);
  const parsedPriorKnowledge = normalizeList(course.recommendedPriorKnowledge);
  const parsedCoreTools = normalizeList(course.coreTools);
  const parsedLearningOutcomes = normalizeList(course.learningObjectives);
  const parsedSkills = normalizeList(course.skills);

  // Check session storage cached enrollments for quick local verification
  const isLocallyEnrolled = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('edtech_student_enrolled_courses');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          return list.some(
            (item: any) =>
              (item.slug && item.slug === slug) ||
              (item.id && (item.id === course._id || item.id === course.id))
          );
        }
      }
    } catch {
      // ignore
    }
    return false;
  }, [slug, course._id, course.id]);

  // Access Permission Verification (Enrolled Student, Admin, Instructor, or Free Course)
  const isEnrolled = Boolean(
    courseData?.isEnrolled ||
    course?.isEnrolled ||
    course?.isOwned ||
    isLocallyEnrolled ||
    (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') ||
    (course.instructorId &&
      ((user as any)?._id === course.instructorId?._id ||
        (user as any)?._id === course.instructorId ||
        (user as any)?.id === course.instructorId)) ||
    ((user as any)?.enrolledCourses?.some(
      (c: any) => (c._id || c.id || c) === (course._id || course.id) || (c.slug || c) === slug
    )) ||
    (course.price === 0 || course.coursePrice === 0)
  );

  // Flattened all lessons list for the Active Classroom Player
  const allLessons = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      duration: number;
      videoUrl: string;
      moduleTitle: string;
      topicTitle: string;
      topicId?: string;
      resources?: Array<{ name: string; type: string; size?: string; url?: string }>;
    }> = [];

    (syllabus || []).forEach((m: any) => {
      (m.topics || []).forEach((t: any) => {
        if (t.lessons && t.lessons.length > 0) {
          t.lessons.forEach((l: any) => {
            list.push({
              id: l._id || l.id || `${m._id}_${t._id}_${l.title}`,
              title: l.title,
              duration: l.duration || t.duration || 15,
              videoUrl: l.playbackReference || l.videoUrl || t.videoUrl || '',
              moduleTitle: m.title,
              topicTitle: t.title,
              topicId: t._id || t.id,
              resources: Array.isArray(l.resources) && l.resources.length > 0 ? l.resources : [],
            });
          });
        } else {
          list.push({
            id: t._id || t.id || `${m._id}_${t.title}`,
            title: t.title,
            duration: t.duration || 30,
            videoUrl: t.videoUrl || '',
            moduleTitle: m.title,
            topicTitle: t.title,
            topicId: t._id || t.id,
            resources: Array.isArray(t.resources) && t.resources.length > 0 ? t.resources : [],
          });
        }
      });
    });
    return list;
  }, [syllabus]);

  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`edtech_course_progress_${slug}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (allLessons.length > 0 && !activeLesson) {
      setActiveLesson(allLessons[0]);
    }
  }, [allLessons, activeLesson]);

  // Load reviews and QA when enrolled
  useEffect(() => {
    if (isEnrolled && slug) {
      coursesApi
        .getMyReview(slug)
        .then((res) => {
          if (res.success && res.data) {
            setExistingReview(res.data);
            setUserRating(res.data.rating || 5);
            setReviewComment(res.data.review || '');
          }
        })
        .catch(() => {});

      coursesApi
        .getQuestions(slug)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setQuestions(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isEnrolled, slug]);

  const progressPercent =
    allLessons.length > 0
      ? Math.round((completedLessonIds.length / allLessons.length) * 100)
      : 0;

  const handleToggleLessonComplete = async (lessonId: string) => {
    if (!slug) return;
    const isCurrentlyCompleted = completedLessonIds.includes(lessonId);
    const nextCompleted = !isCurrentlyCompleted;

    // Optimistic UI update
    setCompletedLessonIds((prev) => {
      const next = isCurrentlyCompleted
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem(`edtech_course_progress_${slug}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const res = await coursesApi.updateProgress(slug, {
        lessonId,
        topicId: activeLesson?.topicId,
        completed: nextCompleted,
      });
      if (res.success && res.data) {
        if (Array.isArray(res.data.completedLessonIds)) {
          setCompletedLessonIds(res.data.completedLessonIds);
          try {
            localStorage.setItem(
              `edtech_course_progress_${slug}`,
              JSON.stringify(res.data.completedLessonIds)
            );
          } catch {}
        }
        if (nextCompleted) {
          success('Lesson marked as completed! Progress synced.');
        } else {
          success('Lesson marked as incomplete.');
        }
      }
    } catch (err: any) {
      console.warn('Progress sync error:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    try {
      setSubmittingReview(true);
      const res = await coursesApi.submitReview(slug, {
        rating: userRating,
        comment: reviewComment,
      });
      if (res.success && res.data) {
        setExistingReview(res.data);
        success('Thank you! Your course review & rating have been saved.');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !slug) return;
    try {
      setSubmittingQuestion(true);
      const res = await coursesApi.askQuestion(slug, {
        question: newQuestionText.trim(),
        lessonId: activeLesson?.id,
        topicId: activeLesson?.topicId,
      });
      if (res.success) {
        setNewQuestionText('');
        success('Question posted! The instructor has received a notification.');
        const qRes = await coursesApi.getQuestions(slug);
        if (qRes.success && Array.isArray(qRes.data)) {
          setQuestions(qRes.data);
        }
      }
    } catch (err: any) {
      console.error('Error asking question:', err);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    const text = replyInputs[questionId]?.trim();
    if (!text || !slug) return;
    try {
      setSubmittingReply((prev) => ({ ...prev, [questionId]: true }));
      const res = await coursesApi.answerQuestion(slug, questionId, {
        answer: text,
      });
      if (res.success) {
        setReplyInputs((prev) => ({ ...prev, [questionId]: '' }));
        success('Answer submitted! The student has received a notification.');
        const qRes = await coursesApi.getQuestions(slug);
        if (qRes.success && Array.isArray(qRes.data)) {
          setQuestions(qRes.data);
        }
      }
    } catch (err: any) {
      console.error('Error answering question:', err);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleNextLesson = () => {
    if (!activeLesson) return;
    const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      setActiveLesson(allLessons[currentIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (!activeLesson) return;
    const currentIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex > 0) {
      setActiveLesson(allLessons[currentIndex - 1]);
    }
  };

  const handleWatchVideo = (
    lessonOrTopic: { title: string; duration?: number; videoUrl?: string; playbackReference?: string },
    topic: { _id?: string; title: string; price: number; isFree?: boolean }
  ) => {
    const targetUrl =
      lessonOrTopic.playbackReference || lessonOrTopic.videoUrl || (topic as any).videoUrl;
    const isFreePreview = Boolean(topic.isFree);

    if (isEnrolled || isFreePreview) {
      if (targetUrl && (targetUrl.startsWith('http') || targetUrl.startsWith('data:'))) {
        setActiveVideoModal({ title: lessonOrTopic.title, url: targetUrl });
      } else {
        setActiveVideoModal({
          title: lessonOrTopic.title,
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        });
      }
    } else {
      // Show locked paywall restriction modal
      setLockedLessonModal({
        title: lessonOrTopic.title,
        topicTitle: topic.title,
        topicId: topic._id,
        topicPrice: topic.price ?? 299,
        duration: lessonOrTopic.duration || 30,
      });
    }
  };

  if (loading && !courseData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
          <div className="h-10 bg-slate-200 rounded-xl w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-40 bg-white rounded-3xl border border-slate-200 p-6 animate-pulse" />
              <div className="h-64 bg-white rounded-3xl border border-slate-200 p-6 animate-pulse" />
              <div className="h-64 bg-white rounded-3xl border border-slate-200 p-6 animate-pulse" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-96 bg-white rounded-3xl border border-slate-200 p-6 animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ACTIVE CLASSROOM LAYOUT FOR PAID / ENROLLED STUDENTS
  if (isEnrolled) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans">
        <Navbar />

        {/* Classroom Header Bar */}
        <div className="bg-white/95 border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 backdrop-blur-md sticky top-0 z-20 shadow-xs">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/dashboard/student"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition shrink-0 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Enrolled & Active
                  </span>
                  <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-indigo-600 font-semibold truncate hidden sm:inline">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate mt-0.5">
                  {course.title}
                </h1>
              </div>
            </div>

            {/* Course Progress Tracker */}
            <div className="flex items-center gap-3.5 shrink-0 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end text-xs font-bold">
                  <span className="text-slate-500">Classroom Progress</span>
                  <span className="text-emerald-600 font-black">{progressPercent}%</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {completedLessonIds.length} of {allLessons.length} lessons completed
                </span>
              </div>
              <div className="w-24 sm:w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Classroom Work Area */}
        <div className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Video Player & Lesson Content */}
            <div className="lg:col-span-8 space-y-5">
              {/* Active Video Player Screen */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md flex flex-col justify-center items-center">
                {activeLesson?.videoUrl ? (
                  activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={
                        activeLesson.videoUrl.includes('embed')
                          ? activeLesson.videoUrl
                          : `https://www.youtube.com/embed/${activeLesson.videoUrl.split('v=')[1] || activeLesson.videoUrl.split('/').pop()}`
                      }
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      autoPlay={false}
                      className="w-full h-full object-contain"
                      src={activeLesson.videoUrl}
                      key={activeLesson.id}
                    />
                  )
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
                      <Video className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-extrabold text-white">{activeLesson?.title || 'Interactive Lesson'}</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Stream authorized for enrolled student. Watch the lecture, follow along with the code, and mark as complete when done.
                    </p>
                  </div>
                )}
              </div>

              {/* Player Control Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {activeLesson?.moduleTitle}
                    </span>
                    <span className="text-slate-300 text-xs">•</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {activeLesson?.topicTitle}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {activeLesson?.title || 'Select a lesson to begin'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Duration: {activeLesson?.duration || 20} mins</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevLesson}
                    disabled={!activeLesson || allLessons.findIndex((l) => l.id === activeLesson.id) === 0}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                    title="Previous Lesson"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {activeLesson && (
                    <button
                      type="button"
                      onClick={() => handleToggleLessonComplete(activeLesson.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                        completedLessonIds.includes(activeLesson.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {completedLessonIds.includes(activeLesson.id)
                          ? 'Completed'
                          : 'Mark as Complete'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNextLesson}
                    disabled={!activeLesson || allLessons.findIndex((l) => l.id === activeLesson.id) === allLessons.length - 1}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer"
                    title="Next Lesson"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Classroom Interactive Tabs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                {/* Tab Selectors */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                  <button
                    type="button"
                    onClick={() => setClassroomTab('overview')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      classroomTab === 'overview'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Overview & Materials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomTab('qa')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      classroomTab === 'qa'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Q&A Doubts ({questions.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomTab('reviews')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      classroomTab === 'reviews'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Rate Course</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomTab('ai_copilot')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      classroomTab === 'ai_copilot'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-100'
                        : 'bg-gradient-to-r from-indigo-50 to-cyan-50 hover:from-indigo-100 hover:to-cyan-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span>✨ AI Learning Copilot</span>
                  </button>
                </div>

                {/* TAB 1: OVERVIEW & DYNAMIC DOWNLOADABLE MATERIALS */}
                {classroomTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        About This Lesson
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {course.description ||
                          'Comprehensive classroom curriculum designed to master core concepts, hands-on workflows, and real-world industrial tools.'}
                      </p>
                    </div>

                    {/* Dynamic Downloadable Materials (ONLY rendered if instructor uploaded files) */}
                    {activeLesson?.resources && activeLesson.resources.length > 0 ? (
                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                          Downloadable Materials
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeLesson.resources.map((res: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-indigo-200 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-800 block truncate">{res.name}</span>
                                  <span className="text-[10px] text-slate-500">
                                    {res.size || 'Attachment'} • {res.type || 'Document'}
                                  </span>
                                </div>
                              </div>
                              <a
                                href={res.url || '#'}
                                download={res.name}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* TAB 2: Q&A DOUBTS WITH TWO-WAY NOTIFICATIONS */}
                {classroomTab === 'qa' && (
                  <div className="space-y-6">
                    {/* Ask a Question Form */}
                    <form onSubmit={handleAskQuestion} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        <span>Ask a Question or Doubt</span>
                      </div>
                      <textarea
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder={`Have a doubt about "${activeLesson?.title || 'this topic'}"? Post it here, and your instructor will receive an immediate in-app notification to answer.`}
                        rows={3}
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 resize-none"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500">
                          Instant two-way notification dispatched upon reply.
                        </span>
                        <button
                          type="submit"
                          disabled={submittingQuestion || !newQuestionText.trim()}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{submittingQuestion ? 'Posting...' : 'Ask Question'}</span>
                        </button>
                      </div>
                    </form>

                    {/* Questions Feed */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Previous Questions & Discussions ({questions.length})
                      </h4>

                      {questions.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200/80 p-4">
                          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-600">No questions posted yet.</p>
                          <p className="text-[11px] text-slate-400 mt-1">Be the first to post a doubt about this lesson!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {questions.map((q) => (
                            <div key={q._id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                    {q.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900">{q.user.name}</span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                        {q.user.role}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(q.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    q.status === 'ANSWERED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {q.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                {q.question}
                              </p>

                              {/* Answers List */}
                              {q.answers && q.answers.length > 0 && (
                                <div className="pl-4 border-l-2 border-indigo-200 space-y-2 pt-1">
                                  {q.answers.map((ans) => (
                                    <div key={ans._id} className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-900">{ans.user.name}</span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                                          {ans.user.role}
                                        </span>
                                        <span className="text-[9px] text-slate-400">
                                          {new Date(ans.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-700">{ans.answer}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Post Reply Box */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={replyInputs[q._id] || ''}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({ ...prev, [q._id]: e.target.value }))
                                  }
                                  placeholder="Reply or answer this doubt..."
                                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                                />
                                <button
                                  type="button"
                                  disabled={submittingReply[q._id] || !replyInputs[q._id]?.trim()}
                                  onClick={() => handleAnswerQuestion(q._id)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                                >
                                  {submittingReply[q._id] ? 'Sending...' : 'Reply'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: COURSE RATING & REVIEWS */}
                {classroomTab === 'reviews' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Course Experience & Rating
                      </h3>
                      <p className="text-xs text-slate-600">
                        Help us improve! Share your honest feedback and rating out of 5 stars.
                      </p>
                    </div>

                    {existingReview && (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900">Your Submitted Review</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= (existingReview.rating || 5)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {existingReview.review && (
                          <p className="text-xs text-emerald-800">{existingReview.review}</p>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                      {/* Star Rating Selector */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-2">
                          Select Star Rating
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className="p-1 rounded-md hover:scale-110 transition cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  star <= userRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-extrabold text-slate-800 ml-2">
                            {userRating} / 5 Stars
                          </span>
                        </div>
                      </div>

                      {/* Review Comment Textarea */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          Your Feedback & Review (Optional)
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="What did you like the most about this course? What could be improved?"
                          rows={3}
                          className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span>{submittingReview ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 4: AI LEARNING COPILOT (CONTEXT-AWARE AI TUTOR) */}
                {classroomTab === 'ai_copilot' && (
                  <AiLearningCopilotTab
                    courseTitle={course.title}
                    moduleTitle={activeLesson?.moduleTitle || activeLesson?.topicTitle || 'Core Curriculum'}
                    lessonTitle={activeLesson?.title || 'Interactive Lesson'}
                    lessonDescription={activeLesson?.description || course.description}
                    userAvatar={user?.profilePhoto}
                  />
                )}
              </div>
            </div>

            {/* Right 4 Cols: Interactive Curriculum Classroom Drawer */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 sticky top-20 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Course Curriculum</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {allLessons.length} Lessons • All Unlocked
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Full Access
                  </span>
                </div>

                {/* Modules & Lessons Scrollable Accordion */}
                <div className="mt-4 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {syllabus.map((mod: any, mIdx: number) => {
                    const isModExpanded = expandedModules[mod._id] !== false;

                    return (
                      <div key={mod._id || mIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        {/* Module Header */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod._id)}
                          className="w-full p-3 bg-slate-100/70 hover:bg-slate-100 text-left flex items-center justify-between gap-2 cursor-pointer transition"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                              Module {mIdx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 truncate">{mod.title}</h4>
                          </div>
                          {isModExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </button>

                        {/* Module Lessons List */}
                        {isModExpanded && (
                          <div className="p-2 space-y-1 bg-white">
                            {(mod.topics || []).flatMap((top: any) =>
                              (top.lessons && top.lessons.length > 0 ? top.lessons : [top]).map((les: any) => {
                                const lessonId = les._id || les.id || `${mod._id}_${top._id}_${les.title}`;
                                const isSelected = activeLesson?.id === lessonId;
                                const isDone = completedLessonIds.includes(lessonId);

                                return (
                                  <button
                                    key={lessonId}
                                    type="button"
                                    onClick={() =>
                                      setActiveLesson({
                                        id: lessonId,
                                        title: les.title,
                                        duration: les.duration || top.duration || 15,
                                        videoUrl: les.playbackReference || les.videoUrl || top.videoUrl || '',
                                        moduleTitle: mod.title,
                                        topicTitle: top.title,
                                        topicId: top._id || top.id,
                                        resources: Array.isArray(les.resources) && les.resources.length > 0 ? les.resources : [],
                                      })
                                    }
                                    className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between gap-2.5 transition cursor-pointer text-xs ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {isDone ? (
                                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                                      ) : (
                                        <Play className={`w-3 h-3 shrink-0 ${isSelected ? 'fill-white text-white' : 'text-indigo-600'}`} />
                                      )}
                                      <span className="truncate">{les.title}</span>
                                    </div>
                                    <span className={`text-[10px] shrink-0 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                      {les.duration || 15}m
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Module Checkpoint Quizzes in Curriculum Drawer */}
                {courseQuizzes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Module Quizzes</span>
                      <span className="text-[10px] text-indigo-600 font-extrabold">{courseQuizzes.length} Available</span>
                    </div>
                    <div className="space-y-1.5">
                      {courseQuizzes.map((q) => (
                        <div
                          key={q._id}
                          onClick={() => {
                            if (!q.isLocked) {
                              setActiveQuizModalId(q._id);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition text-xs ${
                            q.isLocked
                              ? 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'
                              : 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200/80 cursor-pointer text-indigo-950 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {q.isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : q.hasPassed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            )}
                            <span className="truncate">{q.title}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {q.hasPassed ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-black">
                                {q.bestScore}%
                              </span>
                            ) : !q.isLocked ? (
                              <span className="text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded font-black">
                                Start
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Player Modal in Classroom */}
        {activeQuizModalId && (
          <QuizPlayerModal
            quizId={activeQuizModalId}
            isOpen={true}
            onClose={() => setActiveQuizModalId(null)}
          />
        )}

        <Footer />
      </div>
    );
  }


  const displayPrice = course.coursePrice ?? course.price ?? 0;
  const isSoldOut = Boolean(
    course.isSoldOut ||
    (course.maxEnrollmentLimit &&
      course.enrolledCount !== undefined &&
      course.enrolledCount >= course.maxEnrollmentLimit)
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Link
                to="/courses"
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Back to Courses"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Course Curriculum (Syllabus)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1 pl-11">
              {syllabus.length} Module{syllabus.length === 1 ? '' : 's'} • {totalTopics} Topic{totalTopics === 1 ? '' : 's'} • {totalLessons} Lesson{totalLessons === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto pl-11 sm:pl-0">
            <button
              type="button"
              onClick={() => setShowSyllabusModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Syllabus Details</span>
            </button>

            <button
              type="button"
              onClick={handleToggleAll}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
              {allExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              LEFT COLUMN: Instructor Card, All Added Fields, Modules Hierarchy
             ========================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* About the Instructor Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs">
              <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none rounded-r-3xl" />
              <div className="relative z-10">
                <h2 className="text-base sm:text-lg font-black text-slate-900 mb-4">
                  About the Instructor
                </h2>
                <div className="flex items-start gap-4 sm:gap-5">
                  {course.instructorAvatar ? (
                    <img
                      src={course.instructorAvatar}
                      alt={course.instructorName || 'Instructor'}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                      {course.instructorName ? course.instructorName[0].toUpperCase() : 'I'}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                        {course.instructorName || 'Lead Instructor'}
                      </h3>
                      {course.mentorStatus && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          {course.mentorStatus}
                        </span>
                      )}
                      {course.instructorExperience && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {course.instructorExperience}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-indigo-600">
                      {course.instructorHeadline || 'Senior Technology Lead & Certified Cloud Architect'}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1">
                      {course.instructorBio || 'Passionate engineering educator and technical architect with extensive industry experience.'}
                    </p>

                    {/* Professional Summary Tags */}
                    {course.professionalTags && course.professionalTags.length > 0 && (
                      <div className="text-[11px] font-semibold text-slate-600 flex flex-wrap items-center gap-1 pt-1.5">
                        <span className="text-slate-400 font-bold">Experience:</span>
                        {course.professionalTags.map((tag: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center">
                            <span>{tag}</span>
                            {idx < (course.professionalTags?.length || 0) - 1 && (
                              <span className="mx-1 text-slate-300">|</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Experience & Achievement Metrics */}
                    {course.experienceMetrics && course.experienceMetrics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        {course.experienceMetrics.map((met: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-200/60 flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            {met}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Education & Qualifications (Optional - Omitted if empty) */}
                    {course.qualifications && course.qualifications.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        {course.qualifications.map((q: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200/60"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* What You'll Learn Section */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    What You'll Learn
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {parsedLearningOutcomes.map((obj: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100/80">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-slate-800 leading-relaxed">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description & Detailed Overview */}
            {(course.detailedOverview || course.description) && (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Course Overview & Teaching Methodology
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                  {course.detailedOverview || course.description}
                </p>

                {/* Key Skills Tags */}
                {parsedSkills.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Skills & Technologies Taught
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course Foundations & Tools */}
            {(parsedFoundations.length > 0 ||
              parsedCoreTools.length > 0 ||
              parsedPriorKnowledge.length > 0) && (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Course Foundations & Core Technologies
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {parsedFoundations.length > 0 && (
                    <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-2">
                      <h4 className="font-extrabold text-amber-900 text-xs">Foundational Concepts</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedFoundations.map((fc: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {fc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedPriorKnowledge.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs">Prior Knowledge</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedPriorKnowledge.map((pk: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {pk}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedCoreTools.length > 0 && (
                    <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-2">
                      <h4 className="font-extrabold text-blue-900 text-xs">Core Tools</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedCoreTools.map((ct: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {ct}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requirements & Prerequisites */}
            {(parsedRequirements.length > 0 ||
              parsedHardwareReqs.length > 0 ||
              parsedSoftwareReqs.length > 0 ||
              parsedRequiredAccounts.length > 0) && (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Requirements & Prerequisites
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {parsedRequirements.length > 0 && (
                    <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2">
                      <h4 className="font-extrabold text-purple-900 text-xs">General Prerequisites</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedRequirements.map((req: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedHardwareReqs.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs">Hardware Requirements</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedHardwareReqs.map((hr: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {hr}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedSoftwareReqs.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs">Software Requirements</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedSoftwareReqs.map((sr: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {sr}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedRequiredAccounts.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-xs">Required Accounts</h4>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {parsedRequiredAccounts.map((ra: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">• {ra}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Syllabus Modules List */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Course Curriculum Hierarchy
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {isEnrolled ? '✓ Full Access Unlocked' : 'Free Previews Available'}
                </span>
              </div>

              {syllabus.map((mod, modIdx) => {
                const isExpanded = !!expandedModules[mod._id];

                return (
                  <div
                    key={mod._id}
                    className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200"
                  >
                    {/* Module Card Header */}
                    <button
                      onClick={() => toggleModule(mod._id)}
                      className="w-full p-5 sm:p-6 hover:bg-slate-50/70 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 sm:gap-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                          {modIdx + 1}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm sm:text-base">
                            {mod.title.startsWith('Module') ? mod.title : `Module ${modIdx + 1}: ${mod.title}`}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {mod.topicsCount || mod.topics?.length || 0} Topics • {mod.duration || '45m'}
                          </p>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </button>

                    {/* Topics & Lessons Timeline inside Module */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-6">
                        {mod.topics.map((top: any, topIdx: number) => (
                          <div key={top._id || topIdx} className="relative pl-6 space-y-3">
                            {/* Vertical Line Connector */}
                            {topIdx < mod.topics.length - 1 && (
                              <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-indigo-100" />
                            )}

                            {/* Topic Title Header with Layers Icon & Dynamic Description */}
                            <div className="relative flex items-start justify-between gap-3">
                              <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
                                <Layers className="w-3.5 h-3.5" />
                              </div>

                              <div className="pl-3 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {top.title}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    ({top.duration || 30}m)
                                  </span>
                                </div>
                                {top.description && (
                                  <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed">
                                    {top.description}
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 pt-0.5">
                                {top.isFree ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    FREE PREVIEW
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    Topic Price: ₹{top.price}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Sub-lessons inside Topic */}
                            <div className="pl-3 space-y-2">
                              {top.lessons && top.lessons.length > 0 ? (
                                top.lessons.map((les: any, lesIdx: number) => (
                                  <div
                                    key={les._id || lesIdx}
                                    className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs hover:bg-white hover:border-indigo-300 transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                        top.isFree || isEnrolled
                                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                          : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}>
                                        {top.isFree || isEnrolled ? <Video className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-900 text-xs block">{les.title}</span>
                                        <span className="text-[10px] text-slate-500 font-semibold">
                                          {top.isFree ? 'Free Preview Video Lesson' : isEnrolled ? 'Unlocked Lesson' : 'Premium Video Lesson'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                      <span className="text-[11px] text-slate-500 font-semibold">{les.duration || 30}m</span>
                                      <button
                                        type="button"
                                        onClick={() => handleWatchVideo(les, top)}
                                        className={`px-4 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                                          top.isFree || isEnrolled
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                        }`}
                                      >
                                        {top.isFree || isEnrolled ? <Play className="w-3 h-3 fill-current" /> : <Lock className="w-3 h-3" />}
                                        <span>{top.isFree || isEnrolled ? 'Watch Video' : 'Locked Lesson'}</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                      top.isFree || isEnrolled
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}>
                                      {top.isFree || isEnrolled ? <Video className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 text-xs block">{top.title}</span>
                                      <span className="text-[10px] text-slate-500 font-semibold">
                                        {top.isFree ? 'Free Preview Lesson' : isEnrolled ? 'Unlocked Lesson' : 'Premium Video Lesson'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <span className="text-[11px] text-slate-500 font-semibold">{top.duration || 30}m</span>
                                    <button
                                      type="button"
                                      onClick={() => handleWatchVideo(top, top)}
                                      className={`px-4 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                                        top.isFree || isEnrolled
                                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {top.isFree || isEnrolled ? <Play className="w-3 h-3 fill-current" /> : <Lock className="w-3 h-3" />}
                                      <span>{top.isFree || isEnrolled ? 'Watch Video' : 'Locked Lesson'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Sticky Course Investment Card (Matching Image 5)
             ========================================================================= */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
              {/* Card Header with Glowing Gradient and 3D Graphic */}
              <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200 block">
                      Course Investment
                    </span>
                    {isSoldOut ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Sold Out
                      </span>
                    ) : course.maxEnrollmentLimit ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-900/60 backdrop-blur-md text-indigo-100 font-bold text-[10px] border border-indigo-400/30">
                        {course.remainingSeats !== undefined && course.remainingSeats <= 10
                          ? `Only ${course.remainingSeats} Seats Left`
                          : `Cap: ${course.maxEnrollmentLimit} Seats`}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                    {displayPrice === 0 ? 'FREE' : `₹${displayPrice.toLocaleString('en-IN')}`}
                  </div>
                </div>

                {/* Graduation Icon Graphic on Right */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-25">
                  <GraduationCap className="w-24 h-24 text-white" />
                </div>
              </div>

              {/* Card Body & CTA Actions */}
              <div className="p-6 space-y-4">
                {isSoldOut ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 bg-slate-100 text-slate-400 font-black text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200 shadow-none"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Sold Out / Course Full</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await addToCart(course._id || course.id, 'COURSE', {
                        title: course.title,
                        price: course.coursePrice || 0,
                        thumbnail: course.thumbnail,
                        courseId: course._id || course.id,
                      });
                      success('Added to Cart', `"${course.title}" has been added to your shopping cart.`);
                      navigate('/cart');
                    }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <span>Enroll in Full Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <Link
                  to={`/topics?courseId=${course._id || course.id || ''}`}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center text-center cursor-pointer border border-indigo-100"
                >
                  Buy Standalone Topics
                </Link>

                {/* Value Props List with Rounded Colored Icons */}
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span>{course.courseIncludes?.videoHours || 'Full lifetime access & updates'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <MonitorSmartphone className="w-4 h-4" />
                    </div>
                    <span>Access on web, tablet & mobile</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <span>Industry verified completion certificate</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>100% topic credit upgrade guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          INTERACTIVE SYLLABUS POP-UP MODAL
         ========================================================================= */}
      {showSyllabusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-bold text-[10px] tracking-wider uppercase">
                    Curriculum Document
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {syllabus.length} Modules • {totalLessons} Lessons
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white line-clamp-1">
                  {course.title || 'Course Syllabus'}
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Instructor: <span className="text-indigo-300 font-bold">{course.instructorName || 'Lead Instructor'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSyllabusModal(false)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close Syllabus"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/50">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-600">
                  Course Structure & Comprehensive Topic Breakdown
                </p>
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {allExpanded ? 'Collapse All Modules' : 'Expand All Modules'}
                </button>
              </div>

              <div className="space-y-3">
                {syllabus.map((m, mIdx) => {
                  const isExpanded = expandedModules[m._id] ?? true;
                  return (
                    <div
                      key={m._id || mIdx}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => toggleModule(m._id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                            {mIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {m.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {(m.topics || []).length} Topics
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">{m.duration || '45m'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-2">
                          {(m.topics || []).map((topic: any, tIdx: number) => (
                            <div
                              key={topic._id || tIdx}
                              className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <PlayCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="font-bold text-slate-800 text-xs">
                                    {tIdx + 1}. {topic.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {topic.isFree ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Free Preview
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-slate-600">
                                      ₹{topic.price ?? 0}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {topic.duration || 30}m
                                  </span>
                                </div>
                              </div>

                              {topic.description && (
                                <p className="text-[11px] text-slate-500 font-normal pl-5">
                                  {topic.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                Full syllabus is included with lifetime enrollment.
              </div>
              <button
                type="button"
                onClick={() => setShowSyllabusModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IN-APP VIDEO PLAYER MODAL (For Free Previews & Enrolled Students)
         ========================================================================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-black w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            <div className="p-4 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm truncate">{activeVideoModal.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {activeVideoModal.url.includes('youtube.com') || activeVideoModal.url.includes('youtu.be') ? (
                <iframe
                  src={
                    activeVideoModal.url.includes('embed')
                      ? activeVideoModal.url
                      : `https://www.youtube.com/embed/${activeVideoModal.url.split('v=')[1] || activeVideoModal.url.split('/').pop()}`
                  }
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideoModal.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Your browser does not support video playback.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOCKED LESSON / PAYWALL RESTRICTION MODAL
         ========================================================================= */}
      {lockedLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">
                Premium Lesson Locked
              </h3>
              <p className="text-xs text-slate-600 font-semibold">
                "{lockedLessonModal.title}" is part of the full curriculum.
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Enroll in the complete course or purchase this individual topic to unlock instant video access.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Topic:</span>
                <span className="font-bold text-slate-800">{lockedLessonModal.topicTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Standalone Topic Price:</span>
                <span className="font-bold text-indigo-600">₹{lockedLessonModal.topicPrice}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  await addToCart(course._id || course.id, 'COURSE', {
                    title: course.title,
                    price: course.coursePrice || 0,
                    thumbnail: course.thumbnail,
                    courseId: course._id || course.id,
                  });
                  setLockedLessonModal(null);
                  navigate('/cart');
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Enroll in Full Course (₹{displayPrice.toLocaleString('en-IN')})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {lockedLessonModal.topicId && (
                <button
                  type="button"
                  onClick={async () => {
                    await addToCart(lockedLessonModal.topicId!, 'CONTENT_OFFERING', {
                      title: lockedLessonModal.topicTitle || 'Topic Offering',
                      price: lockedLessonModal.topicPrice || 299,
                      topicId: lockedLessonModal.topicId!,
                      courseId: course._id || course.id,
                    });
                    setLockedLessonModal(null);
                    navigate('/cart');
                  }}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 cursor-pointer transition-colors"
                >
                  Buy This Topic Only (₹{lockedLessonModal.topicPrice})
                </button>
              )}

              <button
                type="button"
                onClick={() => setLockedLessonModal(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
