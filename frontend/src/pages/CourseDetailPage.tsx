import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { SlotBookingModal } from '../components/slots/SlotBookingModal';
import { CourseReviewsSection } from '../components/reviews/CourseReviewsSection';
import { useIsMobile } from '../hooks/useIsMobile';
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
  ExternalLink,
} from 'lucide-react';

export interface UniversalVideoSource {
  type: 'embed' | 'direct' | 'invalid_service' | 'external_link';
  embedUrl?: string;
  directUrl?: string;
  serviceName?: string;
  originalUrl: string;
  errorMessage?: string;
}

export const resolveUniversalVideoSource = (rawUrl?: string): UniversalVideoSource | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // 1. YouTube
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch && embedMatch[1]) {
      return { type: 'embed', embedUrl: `https://www.youtube.com/embed/${embedMatch[1]}`, serviceName: 'YouTube', originalUrl: trimmed };
    }
    const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (vParamMatch && vParamMatch[1]) {
      return { type: 'embed', embedUrl: `https://www.youtube.com/embed/${vParamMatch[1]}`, serviceName: 'YouTube', originalUrl: trimmed };
    }
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch && shortMatch[1]) {
      return { type: 'embed', embedUrl: `https://www.youtube.com/embed/${shortMatch[1]}`, serviceName: 'YouTube', originalUrl: trimmed };
    }
    const specialMatch = trimmed.match(/youtube\.com\/(?:shorts|live)\/([a-zA-Z0-9_-]{11})/i);
    if (specialMatch && specialMatch[1]) {
      return { type: 'embed', embedUrl: `https://www.youtube.com/embed/${specialMatch[1]}`, serviceName: 'YouTube', originalUrl: trimmed };
    }
    return {
      type: 'invalid_service',
      serviceName: 'YouTube',
      originalUrl: trimmed,
      errorMessage: 'The instructor provided a generic YouTube URL without a specific 11-character video ID.',
    };
  }

  // 2. Vimeo
  if (trimmed.includes('vimeo.com')) {
    const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'embed',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
        serviceName: 'Vimeo',
        originalUrl: trimmed,
      };
    }
    return {
      type: 'invalid_service',
      serviceName: 'Vimeo',
      originalUrl: trimmed,
      errorMessage: 'The instructor provided a Vimeo link without a valid numeric video ID.',
    };
  }

  // 3. Loom (Very popular in dev tutorials)
  if (trimmed.includes('loom.com')) {
    const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
    if (loomMatch && loomMatch[1]) {
      return {
        type: 'embed',
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
        serviceName: 'Loom',
        originalUrl: trimmed,
      };
    }
  }

  // 4. Google Drive
  if (trimmed.includes('drive.google.com')) {
    const gdriveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/i);
    if (gdriveMatch && gdriveMatch[1]) {
      return {
        type: 'embed',
        embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
        serviceName: 'Google Drive',
        originalUrl: trimmed,
      };
    }
  }

  // 5. Wistia
  if (trimmed.includes('wistia.com') || trimmed.includes('wi.st')) {
    const wistiaMatch = trimmed.match(/(?:wistia\.com\/medias|wi\.st)\/([a-zA-Z0-9]+)/i);
    if (wistiaMatch && wistiaMatch[1]) {
      return {
        type: 'embed',
        embedUrl: `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`,
        serviceName: 'Wistia',
        originalUrl: trimmed,
      };
    }
  }

  // 6. Dailymotion
  if (trimmed.includes('dailymotion.com') || trimmed.includes('dai.ly')) {
    const dmMatch = trimmed.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
    if (dmMatch && dmMatch[1]) {
      return {
        type: 'embed',
        embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`,
        serviceName: 'Dailymotion',
        originalUrl: trimmed,
      };
    }
  }

  // 7. Direct video files (MP4, WebM, OGG, MOV, Cloudinary, AWS S3 / CloudFront, Firebase Storage)
  const isDirectVideo =
    /\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i.test(trimmed) ||
    trimmed.includes('res.cloudinary.com') ||
    trimmed.includes('firebasestorage.googleapis.com') ||
    trimmed.includes('s3.amazonaws.com');

  if (isDirectVideo) {
    return {
      type: 'direct',
      directUrl: trimmed,
      serviceName: 'Native Video Stream',
      originalUrl: trimmed,
    };
  }

  // 8. Any other custom embed or HTTPS link (Custom CDN, private player, Notion video, Bunny.net, etc.)
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'embed',
      embedUrl: trimmed,
      serviceName: 'External Video Host',
      originalUrl: trimmed,
    };
  }

  return null;
};

export const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { success } = useToast();
  const isMobile = useIsMobile(500);
  const progressStorageKey = `edtech_course_progress_${user?._id || user?.id || 'guest'}_${slug}`;
  const [lessonProgress, setLessonProgress] = useState<{
    storageKey: string;
    lessonIds: string[];
  }>(() => {
    try {
      const stored = localStorage.getItem(progressStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return {
        storageKey: progressStorageKey,
        lessonIds: Array.isArray(parsed) ? parsed : [],
      };
    } catch {
      return { storageKey: progressStorageKey, lessonIds: [] };
    }
  });
  const completedLessonIds =
    lessonProgress.storageKey === progressStorageKey ? lessonProgress.lessonIds : [];
  const setCompletedLessonIds = useCallback(
    (next: string[] | ((previous: string[]) => string[])) => {
      setLessonProgress((current) => {
        const previous =
          current.storageKey === progressStorageKey ? current.lessonIds : [];
        return {
          storageKey: progressStorageKey,
          lessonIds: typeof next === 'function' ? next(previous) : next,
        };
      });
    },
    [progressStorageKey]
  );
  const [courseData, setCourseData] = useState<CourseDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(true);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

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
  const [activePublicTab, setActivePublicTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews' | 'faqs'>('overview');

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
          const completedIds = Array.isArray(res.data.completedLessonIds)
            ? res.data.completedLessonIds
            : [];
          setCompletedLessonIds(completedIds);
          try {
            localStorage.setItem(progressStorageKey, JSON.stringify(completedIds));
          } catch {}
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
  }, [progressStorageKey, setCompletedLessonIds, slug]);

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

  // Utility to reliably normalize and parse array or newline list values without breaking sentences at commas
  const normalizeList = (raw: any): string[] => {
    if (!raw) return [];
    let items: string[] = [];
    if (Array.isArray(raw)) {
      items = raw.flatMap((item) =>
        typeof item === 'string'
          ? item.split(/\r?\n/).map((s) => s.replace(/^[\s\d+.\-•*–—>)\]]+/, '').trim()).filter(Boolean)
          : [String(item).trim()]
      );
    } else if (typeof raw === 'string') {
      items = raw.split(/\r?\n/).map((s) => s.replace(/^[\s\d+.\-•*–—>)\]]+/, '').trim()).filter(Boolean);
    }
    // Deduplicate identical items
    return Array.from(new Set(items));
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
  const parsedTargetAudience = normalizeList(course.targetAudience);
  const parsedCourseGoals = normalizeList(course.courseGoals);
  const parsedMethodology = normalizeList(course.teachingMethodology);

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
            const data: any = res.data;
            const rev = data.review !== undefined ? data.review : data;
            if (rev) {
              setExistingReview(rev);
              setUserRating(rev.rating || 5);
              setReviewComment(rev.comment || rev.review || '');
            }
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
        localStorage.setItem(progressStorageKey, JSON.stringify(next));
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
              progressStorageKey,
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
        const rev = (res.data as any).review || res.data;
        setExistingReview(rev);
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
        <div className="bg-white/95 border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 backdrop-blur-md sticky top-0 z-20 shadow-xs">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                to="/dashboard/student"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 transition shrink-0 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Enrolled
                  </span>
                  <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-[#FA5A36] font-semibold truncate hidden sm:inline">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-xs sm:text-base font-extrabold text-slate-900 truncate mt-0.5">
                  {course.title}
                </h1>
              </div>
            </div>

            {/* Course Progress Tracker */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 shrink-0 bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-1.5 sm:gap-2 sm:justify-end text-xs font-bold">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-emerald-600 font-black">{progressPercent}%</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {completedLessonIds.length} of {allLessons.length} lessons
                </span>
              </div>
              <div className="w-20 sm:w-32 bg-slate-200 h-2 sm:h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Classroom Work Area */}
        <div className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left 8 Cols: Video Player & Lesson Content */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-5">
              {/* Active Video Player Screen */}
              <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md flex flex-col justify-center items-center">
                {(() => {
                  const rawUrl = activeLesson?.videoUrl?.trim();
                  if (!rawUrl) {
                    return (
                      <div className="text-center p-6 sm:p-8 space-y-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] flex items-center justify-center mx-auto text-[#FA5A36] shadow-xs">
                          <Video className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white">{activeLesson?.title || 'Interactive Lesson'}</h3>
                        <p className="text-xs text-slate-300 max-w-md mx-auto">
                          No video file or stream has been attached to this lesson yet by the instructor.
                        </p>
                      </div>
                    );
                  }

                  const resolved = resolveUniversalVideoSource(rawUrl);

                  // 1. Valid embedded iframe (YouTube, Vimeo, Loom, Google Drive, Wistia, Dailymotion, or custom embed)
                  if (resolved?.type === 'embed' && resolved.embedUrl) {
                    return (
                      <iframe
                        src={resolved.embedUrl}
                        title={activeLesson?.title || `${resolved.serviceName || 'Video'} Lecture`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                      />
                    );
                  }

                  // 2. Direct video file stream (MP4, WebM, Cloudinary, S3, Firebase)
                  if (resolved?.type === 'direct' && resolved.directUrl) {
                    return (
                      <video
                        controls
                        autoPlay={false}
                        className="w-full h-full object-contain"
                        src={resolved.directUrl}
                        key={activeLesson?.id || resolved.directUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    );
                  }

                  // 3. Known service but incomplete or missing video ID
                  if (resolved?.type === 'invalid_service') {
                    return (
                      <div className="text-center p-6 sm:p-8 space-y-3 max-w-md">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xs">
                          <Video className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white">
                          {resolved.serviceName} Link Missing Video ID
                        </h3>
                        <p className="text-xs text-slate-300">
                          {resolved.errorMessage || 'The instructor link is missing a specific video identifier.'}
                        </p>
                        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-left">
                          <p className="text-[11px] text-slate-400">Provided Link:</p>
                          <p className="text-xs text-amber-300 font-mono break-all">{resolved.originalUrl}</p>
                        </div>
                        <a
                          href={resolved.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Link in New Tab
                        </a>
                      </div>
                    );
                  }

                  // 4. Default fallback: attempt to embed, or offer direct external launch
                  return (
                    <div className="text-center p-6 sm:p-8 space-y-3 max-w-md">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FA5A36]/10 border border-[#FA5A36]/30 flex items-center justify-center mx-auto text-[#FA5A36] shadow-xs">
                        <Video className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white">External Lesson Resource</h3>
                      <p className="text-xs text-slate-300">
                        This lecture points to an external link provided by the instructor.
                      </p>
                      <a
                        href={rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FA5A36] hover:bg-[#E04824] text-white text-xs font-bold transition shadow-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Video in External Player
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Player Control Bar */}
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#FA5A36] truncate">
                      {activeLesson?.moduleTitle}
                    </span>
                    <span className="text-slate-300 text-xs">•</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                      {activeLesson?.topicTitle}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                    {activeLesson?.title || 'Select a lesson to begin'}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#FA5A36]" />
                    <span>Duration: {activeLesson?.duration || 20} mins</span>
                  </div>
                </div>

                {/* Action Buttons: Stacked / Responsive Touch Controls on Mobile */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={handlePrevLesson}
                    disabled={!activeLesson || allLessons.findIndex((l) => l.id === activeLesson.id) === 0}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer flex items-center gap-1"
                    title="Previous Lesson"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs font-bold hidden min-[400px]:inline sm:hidden">Prev</span>
                  </button>

                  {activeLesson && (
                    <button
                      type="button"
                      onClick={() => handleToggleLessonComplete(activeLesson.id)}
                      className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        completedLessonIds.includes(activeLesson.id)
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#FA5A36] hover:bg-[#E04322] text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition cursor-pointer flex items-center gap-1"
                    title="Next Lesson"
                  >
                    <span className="text-xs font-bold hidden min-[400px]:inline sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Classroom Interactive Tabs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                {/* Tab Selectors */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 sm:pb-3 border-b border-slate-100 scrollbar-none flex-nowrap sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setClassroomTab('overview')}
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shrink-0 sm:shrink ${
                      classroomTab === 'overview'
                        ? 'bg-[#FA5A36] text-white shadow-xs'
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
                        ? 'bg-[#FA5A36] text-white shadow-xs'
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
                        ? 'bg-[#FA5A36] text-white shadow-xs'
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
                        ? 'bg-[#FA5A36] text-white shadow-xs shadow-[#FA5A36]/20'
                        : 'bg-[#FFF5F2] hover:bg-[#FFE6E0] text-[#FA5A36] border border-[#FFCCC2]'
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
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-[#FFCCC2] transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-[#FA5A36] shrink-0" />
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
                                className="text-[11px] font-bold text-[#FA5A36] hover:text-[#FA5A36] flex items-center gap-1 cursor-pointer"
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
                        <HelpCircle className="w-4 h-4 text-[#FA5A36]" />
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
                          className="px-4 py-2 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                                  <div className="w-7 h-7 rounded-full bg-[#FFE6E0] text-[#FA5A36] font-bold text-xs flex items-center justify-center shrink-0">
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
                                <div className="pl-4 border-l-2 border-[#FFCCC2] space-y-2 pt-1">
                                  {q.answers.map((ans) => (
                                    <div key={ans._id} className="bg-[#FFF5F2]/50 p-2.5 rounded-lg border border-[#FFCCC2] space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-slate-900">{ans.user.name}</span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FFE6E0] text-[#C23315] font-bold">
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
                                  className="px-3 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer"
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
                    <CourseReviewsSection courseSlug={slug!} isEnrolled={isEnrolled} />
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
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 min-[1024px]:sticky min-[1024px]:top-20 shadow-xs">
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
                <div className="mt-3.5 sm:mt-4 space-y-2.5 sm:space-y-3 max-h-96 min-[1024px]:max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {syllabus.map((mod: any, mIdx: number) => {
                    const isModExpanded = expandedModules[mod._id] !== false;

                    return (
                      <div key={mod._id || mIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        {/* Module Header */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod._id)}
                          className="w-full p-2.5 sm:p-3 bg-slate-100/70 hover:bg-slate-100 text-left flex items-center justify-between gap-2 cursor-pointer transition"
                        >
                          <div className="min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-bold text-[#FA5A36] uppercase tracking-wider block">
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
                                    className={`w-full p-2 sm:p-2.5 rounded-lg text-left flex items-center justify-between gap-2 transition cursor-pointer text-xs ${
                                      isSelected
                                        ? 'bg-[#FA5A36] text-white font-bold shadow-xs'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {isDone ? (
                                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                                      ) : (
                                        <Play className={`w-3 h-3 shrink-0 ${isSelected ? 'fill-white text-white' : 'text-[#FA5A36]'}`} />
                                      )}
                                      <span className="truncate">{les.title}</span>
                                    </div>
                                    <span className={`text-[10px] shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
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
                      <span className="text-[10px] text-[#FA5A36] font-extrabold">{courseQuizzes.length} Available</span>
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
                              : 'bg-[#FFF5F2]/50 hover:bg-[#FFF5F2] border-[#FFCCC2] cursor-pointer text-indigo-950 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {q.isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : q.hasPassed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5 text-[#FA5A36] shrink-0" />
                            )}
                            <span className="truncate">{q.title}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {q.hasPassed ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-black">
                                {q.bestScore}%
                              </span>
                            ) : !q.isLocked ? (
                              <span className="text-[10px] text-[#FA5A36] bg-[#FFE6E0] px-2 py-0.5 rounded font-black">
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans">
      <Navbar />

      {/* =========================================================================
          HERO BANNER (Screen 3: Midnight Dark Hero with Breadcrumb & Dynamic Meta Stats)
         ========================================================================= */}
      <section className="bg-[#0B1120] text-white pt-8 pb-12 border-b border-slate-800">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">/</span>
            <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
            <span className="text-slate-600">/</span>
            {course.category && (
              <>
                <Link to={`/courses?category=${encodeURIComponent(course.category)}`} className="hover:text-white transition-colors">
                  {course.category}
                </Link>
                <span className="text-slate-600">/</span>
              </>
            )}
            <span className="text-slate-200 font-medium truncate max-w-md">{course.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {course.category && (
                  <span className="px-3 py-1 rounded-full bg-[#FA5A36]/15 border border-[#FA5A36]/30 text-[#FA5A36] text-xs font-semibold uppercase tracking-wider">
                    {course.category}
                  </span>
                )}
                {course.level && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 text-xs font-medium border border-white/10">
                    {course.level}
                  </span>
                )}
                {course.mentorStatus && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {course.mentorStatus}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-3xl">
                {course.headline || course.subtitle || course.description}
              </p>

              {/* Meta Stats Row - 100% Dynamic from MongoDB */}
              <div className="flex flex-wrap items-center gap-y-3 gap-x-5 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                {course.rating && course.rating > 0 ? (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-amber-300">{course.rating}</span>
                    {Boolean(course.reviewsCount || course.reviews?.length) && (
                      <span className="text-slate-400 font-normal">
                        ({course.reviewsCount || course.reviews?.length}{' '}
                        {(course.reviewsCount === 1 || course.reviews?.length === 1) ? 'review' : 'reviews'})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg text-slate-300">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-slate-200">New Course</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>
                    {(course.enrolledCount !== undefined && course.enrolledCount !== null
                      ? course.enrolledCount
                      : course.totalEnrolled || 0
                    ).toLocaleString()}{' '}
                    {(course.enrolledCount === 1 || course.totalEnrolled === 1) ? 'student' : 'students'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-slate-400">Created by</span>
                  <span className="font-semibold text-white">{course.instructorName || 'Lead Instructor'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Updated{' '}
                    {course.updatedAt
                      ? new Date(course.updatedAt).toLocaleDateString()
                      : course.createdAt
                      ? new Date(course.createdAt).toLocaleDateString()
                      : 'Recently'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{course.language || 'English'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STICKY TAB SUB-HEADER (Screen 3 Tabs: Overview, Curriculum, Instructor, Reviews)
         ========================================================================= */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar py-3">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'curriculum', label: `Curriculum (${syllabus.length} Modules)` },
              { id: 'instructor', label: 'Instructor' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActivePublicTab(tab.id as any);
                  const el = document.getElementById(`section-${tab.id}`);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className={`pb-1 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  activePublicTab === tab.id
                    ? 'border-[#FA5A36] text-[#FA5A36] font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              LEFT COLUMN: Overview, What You'll Learn, Curriculum, Instructor, Reviews
             ========================================================================= */}
          <div className="lg:col-span-8 space-y-8">
            {/* What You'll Learn Section */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <div id="section-overview" className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center border border-[#FFCCC2]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    What You'll Learn
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {parsedLearningOutcomes.map((obj: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-[#FA5A36] shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-slate-800 leading-relaxed">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description & Detailed Overview */}
            {(course.detailedOverview || course.description) && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Course Description
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
                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course Curriculum Accordion */}
            <div id="section-curriculum" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Course Curriculum
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {syllabus.length} Modules • {totalTopics} Topics • {totalLessons} Lessons
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSyllabusModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Syllabus Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
                    {allExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {syllabus.map((mod, modIdx) => {
                  const isExpanded = !!expandedModules[mod._id];

                  return (
                    <div
                      key={mod._id}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all duration-200"
                    >
                      {/* Module Card Header */}
                      <button
                        onClick={() => toggleModule(mod._id)}
                        className="w-full p-4 sm:p-5 hover:bg-slate-50/70 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {modIdx + 1}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                              {mod.title.startsWith('Module') ? mod.title : `Module ${modIdx + 1}: ${mod.title}`}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              {mod.topicsCount || mod.topics?.length || 0} Topics • {mod.duration || '45m'}
                            </p>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#FFF5F2] text-slate-600 hover:text-[#FA5A36] flex items-center justify-center transition-colors shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#FA5A36]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </button>

                      {/* Topics & Lessons Timeline inside Module */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                          {mod.topics.map((top: any, topIdx: number) => (
                            <div key={top._id || topIdx} className="space-y-2 pt-2">
                              {/* Topic Title Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-[#FA5A36] shrink-0" />
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {top.title}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    ({top.duration || 30}m)
                                  </span>
                                </div>

                                <div className="shrink-0">
                                  {top.isFree ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      FREE PREVIEW
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      Topic Price: ₹{top.price}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {top.description && (
                                <p className="text-xs text-slate-500 pl-6 leading-relaxed">
                                  {top.description}
                                </p>
                              )}

                              {/* Lessons inside Topic */}
                              <div className="pl-6 space-y-1.5">
                                {top.lessons && top.lessons.length > 0 ? (
                                  top.lessons.map((les: any, lesIdx: number) => (
                                    <div
                                      key={les._id || lesIdx}
                                      className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:bg-white hover:border-[#FFCCC2] transition-all"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                          top.isFree || isEnrolled
                                            ? 'bg-[#FFF5F2] text-[#FA5A36] border-[#FFCCC2]'
                                            : 'bg-slate-100 text-slate-400 border-slate-200'
                                        }`}>
                                          {top.isFree || isEnrolled ? <Video className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-500" />}
                                        </div>
                                        <div>
                                          <span className="font-bold text-slate-800 text-xs block">{les.title}</span>
                                          <span className="text-[10px] text-slate-400">
                                            {top.isFree ? 'Free Preview Lesson' : isEnrolled ? 'Unlocked Lesson' : 'Included in Course'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                                        <span className="text-[11px] text-slate-400 font-medium">{les.duration || 30}m</span>
                                        <button
                                          type="button"
                                          onClick={() => handleWatchVideo(les, top)}
                                          className={`px-3 py-1 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                            top.isFree || isEnrolled
                                              ? 'bg-[#FA5A36] hover:bg-[#E04322] text-white shadow-2xs'
                                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                          }`}
                                        >
                                          {top.isFree || isEnrolled ? <Play className="w-3 h-3 fill-white" /> : <Lock className="w-3 h-3" />}
                                          <span>{top.isFree || isEnrolled ? 'Preview' : 'Locked'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                        top.isFree || isEnrolled
                                          ? 'bg-[#FFF5F2] text-[#FA5A36] border-[#FFCCC2]'
                                          : 'bg-slate-100 text-slate-400 border-slate-200'
                                      }`}>
                                        {top.isFree || isEnrolled ? <Video className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-slate-500" />}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-800 text-xs block">{top.title}</span>
                                        <span className="text-[10px] text-slate-400">
                                          {top.isFree ? 'Free Preview' : 'Included in Course'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                                      <span className="text-[11px] text-slate-400 font-medium">{top.duration || 30}m</span>
                                      <button
                                        type="button"
                                        onClick={() => handleWatchVideo(top, top)}
                                        className={`px-3 py-1 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                          top.isFree || isEnrolled
                                            ? 'bg-[#FA5A36] hover:bg-[#E04322] text-white shadow-2xs'
                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                        }`}
                                      >
                                        {top.isFree || isEnrolled ? <Play className="w-3 h-3 fill-white" /> : <Lock className="w-3 h-3" />}
                                        <span>{top.isFree || isEnrolled ? 'Preview' : 'Locked'}</span>
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

            {/* Comprehensive Requirements & Prerequisites (100% Dynamic from Course) */}
            {(parsedRequirements.length > 0 ||
              parsedHardwareReqs.length > 0 ||
              parsedSoftwareReqs.length > 0 ||
              parsedRequiredAccounts.length > 0 ||
              parsedFoundations.length > 0 ||
              parsedPriorKnowledge.length > 0 ||
              parsedCoreTools.length > 0) && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Requirements & Prerequisites
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Everything you need before starting this course
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
                  {/* 1. General Prerequisites */}
                  {parsedRequirements.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FA5A36]" />
                        General Prerequisites
                      </h3>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {parsedRequirements.map((req: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FA5A36] mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 2. Hardware Requirements */}
                  {parsedHardwareReqs.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-blue-600" />
                        Hardware Requirements
                      </h3>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {parsedHardwareReqs.map((req: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Software Requirements */}
                  {parsedSoftwareReqs.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-600" />
                        Software Requirements
                      </h3>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {parsedSoftwareReqs.map((req: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. Required Accounts */}
                  {parsedRequiredAccounts.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Required Accounts
                      </h3>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {parsedRequiredAccounts.map((req: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 5. Core Tools Used */}
                  {parsedCoreTools.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        Core Tools & Platforms
                      </h3>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedCoreTools.map((tool: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Foundational Concepts */}
                  {parsedFoundations.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#FA5A36]" />
                        Foundational Concepts
                      </h3>
                      <ul className="space-y-1.5 text-slate-600 pl-1">
                        {parsedFoundations.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FA5A36] mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Target Audience ("Who this course is for") */}
            {parsedTargetAudience.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Who this course is for
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Designed for learners across various skill stages and career backgrounds
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedTargetAudience.map((audience: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
                      <Users className="w-4 h-4 text-[#FA5A36] shrink-0 mt-0.5" />
                      <span>{audience}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Goals & Milestones */}
            {parsedCourseGoals.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Course Goals & Milestones
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Key outcomes and milestones you will accomplish throughout the program
                  </p>
                </div>
                <div className="space-y-2">
                  {parsedCourseGoals.map((goal: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FFF5F2]/50 border border-[#FFCCC2]/40 text-xs sm:text-sm text-slate-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#FA5A36] shrink-0 mt-0.5" />
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teaching Methodology */}
            {parsedMethodology.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Teaching Methodology
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Structured hands-on pedagogy and real-world project workflows
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedMethodology.map((m: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor Card */}
            <div id="section-instructor" className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                About the Instructor
              </h2>
              <div className="flex items-start gap-4 sm:gap-5">
                {course.instructorAvatar ? (
                  <img
                    src={course.instructorAvatar}
                    alt={course.instructorName || 'Instructor'}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center shrink-0">
                    {course.instructorName ? course.instructorName[0].toUpperCase() : 'I'}
                  </div>
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {course.instructorName || 'Lead Instructor'}
                    </h3>
                    {course.instructorExperience && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {course.instructorExperience}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#FA5A36]">
                    {course.instructorHeadline || 'Senior Technology Lead & Certified Cloud Architect'}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
                    {course.instructorBio || 'Passionate engineering educator and technical architect with extensive industry experience.'}
                  </p>

                  {/* Tags */}
                  {course.professionalTags && course.professionalTags.length > 0 && (
                    <div className="text-[11px] font-semibold text-slate-600 flex flex-wrap items-center gap-1.5 pt-2">
                      <span className="text-slate-400 font-bold">Tags:</span>
                      {course.professionalTags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Book Live Slot Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSlotModalOpen(true)}
                      className="px-4 py-2 bg-[#FA5A36]/10 hover:bg-[#FA5A36]/20 text-[#FA5A36] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Book 1-on-1 Mentorship / Live Slot</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div id="section-reviews" className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Student Reviews & Feedback
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Real verified ratings and feedback from enrolled students
                  </p>
                </div>
              </div>

              {/* Dynamic Database Reviews with 1-5 Star Breakdown */}
              <CourseReviewsSection courseSlug={slug!} isEnrolled={isEnrolled} />
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Sticky Purchase Card (Matching Screen 3)
             ========================================================================= */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
              {/* Video Preview Box */}
              <div
                className="relative aspect-video rounded-t-3xl overflow-hidden bg-slate-900 cursor-pointer group"
                onClick={() => {
                  const firstLes = allLessons[0];
                  const firstTopic = syllabus[0]?.topics?.[0];
                  if (firstLes && firstTopic) {
                    handleWatchVideo(firstLes, firstTopic);
                  } else if (firstTopic) {
                    handleWatchVideo(firstTopic, firstTopic);
                  }
                }}
              >
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#0B1120] flex items-center justify-center" />
                )}
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/30 transition-colors flex flex-col items-center justify-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-[#FA5A36] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                  <span className="text-white text-xs font-bold drop-shadow-md">Preview this course</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Pricing Block - Clean Main Price Only */}
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {displayPrice === 0 ? 'FREE' : `₹${displayPrice.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button (Brand Coral) */}
                {isSoldOut ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 bg-slate-100 text-slate-400 font-medium text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200"
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
                    className="w-full py-3.5 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C93516] text-white font-medium text-sm rounded-xl shadow-md shadow-[#FA5A36]/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <span>Add to Cart</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Secondary Action: Buy Standalone Topics */}
                <Link
                  to={`/topics?courseId=${course._id || course.id || ''}`}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs rounded-xl transition-colors flex items-center justify-center text-center cursor-pointer border border-slate-300"
                >
                  Buy Standalone Topics
                </Link>

                <p className="text-center text-[11px] text-slate-400 font-normal">
                  30-Day Money-Back Guarantee • Lifetime Access
                </p>

                {/* Value Checklist - 100% Dynamic from Course Setup */}
                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs font-normal text-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    This course includes:
                  </span>

                  {course.courseIncludes?.videoHours ? (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0 border border-[#FFCCC2]/40">
                        <Video className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span className="font-medium text-slate-800">{course.courseIncludes.videoHours}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span>Comprehensive on-demand video lessons</span>
                    </div>
                  )}

                  {course.courseIncludes?.resourcesCount ? (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0 border border-[#FFCCC2]/40">
                        <FileText className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span className="font-medium text-slate-800">{course.courseIncludes.resourcesCount}</span>
                    </div>
                  ) : totalLessons > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span>{totalLessons} lessons & downloadable resources</span>
                    </div>
                  ) : null}

                  {course.courseIncludes?.projectsCount && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0 border border-[#FFCCC2]/40">
                        <Layers className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span className="font-medium text-slate-800">{course.courseIncludes.projectsCount}</span>
                    </div>
                  )}

                  {course.courseIncludes?.lifetimeAccess !== false && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <MonitorSmartphone className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span>Full lifetime access on mobile & desktop</span>
                    </div>
                  )}

                  {course.courseIncludes?.certificate !== false && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span>Verified certificate of completion</span>
                    </div>
                  )}

                  {course.courseIncludes?.qaSupport !== false && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-[#FA5A36]" />
                      </div>
                      <span>Dedicated mentor Q&A support</span>
                    </div>
                  )}

                  {Array.isArray(course.courseIncludes?.otherBenefits) &&
                    course.courseIncludes.otherBenefits.map((benefit: string, bIdx: number) => (
                      <div key={bIdx} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span>{benefit}</span>
                      </div>
                    ))}
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
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF5F2]0/30 border border-[#FFCCC2] text-indigo-200 font-bold text-[10px] tracking-wider uppercase">
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
                  Instructor: <span className="text-[#FFE6E0] font-bold">{course.instructorName || 'Lead Instructor'}</span>
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
                  className="text-xs font-bold text-[#FA5A36] hover:text-[#C23315] cursor-pointer"
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
                          <span className="w-7 h-7 rounded-xl bg-[#FFF5F2] text-[#FA5A36] font-black text-xs flex items-center justify-center shrink-0">
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
                                  <PlayCircle className="w-3.5 h-3.5 text-[#FA5A36] shrink-0" />
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
                <PlayCircle className="w-5 h-5 text-[#FA5A36]" />
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
              {(() => {
                const modalUrl = activeVideoModal.url.trim();
                const resolved = resolveUniversalVideoSource(modalUrl);

                if (resolved?.type === 'embed' && resolved.embedUrl) {
                  return (
                    <iframe
                      src={resolved.embedUrl}
                      title={activeVideoModal.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  );
                }

                if (resolved?.type === 'direct' && resolved.directUrl) {
                  return (
                    <video
                      src={resolved.directUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support video playback.
                    </video>
                  );
                }

                if (resolved?.type === 'invalid_service') {
                  return (
                    <div className="p-6 text-center text-slate-300 space-y-3 max-w-md">
                      <p className="font-semibold text-white">{resolved.serviceName} Link Missing Video ID</p>
                      <p className="text-xs text-slate-400">{resolved.errorMessage}</p>
                      <a
                        href={resolved.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Link in New Tab
                      </a>
                    </div>
                  );
                }

                return (
                  <div className="p-6 text-center text-slate-300 space-y-3 max-w-md">
                    <p className="font-semibold text-white">External Lesson Video</p>
                    <a
                      href={modalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FA5A36] text-white text-xs font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Video in External Player
                    </a>
                  </div>
                );
              })()}
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
                <span className="font-bold text-[#FA5A36]">₹{lockedLessonModal.topicPrice}</span>
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
                className="w-full py-3 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FA5A36]/25 cursor-pointer transition-all flex items-center justify-center gap-2"
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
                  className="w-full py-2.5 bg-[#FFF5F2] hover:bg-[#FFEAE4] text-[#FA5A36] font-bold text-xs rounded-xl border border-[#FFCCC2] cursor-pointer transition-colors"
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

      {/* Live Class & Mentorship Slot Booking Modal */}
      <SlotBookingModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        instructorId={course.instructorId?._id || course.instructorId}
        courseId={course._id}
        instructorName={course.instructorName}
        instructorAvatar={course.instructorAvatar}
        courseTitle={course.title}
      />

      <Footer />
    </div>
  );
};
