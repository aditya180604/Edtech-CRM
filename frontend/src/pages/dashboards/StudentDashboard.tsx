import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getStudentDashboard, toggleWishlist } from '../../api/studentDashboard';
import { authApi } from '../../api/auth';
import { coursesApi } from '../../api/courses';
import type { StudentDashboardData, ActiveEnrolledCourse } from '../../types/studentDashboard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { LiveStartedBanner } from '../../components/dashboard/LiveStartedBanner';
import { normalizeImageUrl } from '../../utils/imageUrl';
import {
  Search,
  Bell,
  Mail,
  BookOpen,
  CheckCircle2,
  Award,
  ArrowRight,
  Play,
  Sparkles,
  Layers,
  Heart,
  ChevronRight,
  Video,
  AlertCircle,
  Star,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  X,
  HelpCircle,
  LayoutDashboard,
  CreditCard,
  User as UserIcon,
  Settings as SettingsIcon,
  Menu,
  ChevronLeft,
  Calendar,
  Clock,
  RefreshCw,
  LogOut,
  GraduationCap,
  Send,
  Plus,
  Filter,
  Save,
  Lock,
  Globe,
  BellRing,
  Building,
  Camera,
  Upload,
  Trash2,
  MapPin,
  Briefcase,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { quizzesApi, type QuizItem } from '../../api/quizzes';
import { QuizPlayerModal } from '../../components/quiz/QuizPlayerModal';
import { consultationsApi, type ConsultationBooking } from '../../api/consultations';
import { webinarsApi } from '../../api/webinars';
import { notificationsApi } from '../../api/notifications';
import { useToast } from '../../context/ToastContext';

type StudentTab =
  | 'dashboard'
  | 'my-learning'
  | 'live-classes'
  | 'mentorship'
  | 'assessments'
  | 'passport'
  | 'certificates'
  | 'wishlist'
  | 'orders'
  | 'messages'
  | 'settings';

interface QnAQuestion {
  id: string;
  courseTitle: string;
  courseId: string;
  topicTitle?: string;
  questionTitle: string;
  questionBody: string;
  createdAt: string;
  status: 'ANSWERED' | 'PENDING';
  answers: {
    instructorName: string;
    instructorPhoto?: string;
    answerText: string;
    answeredAt: string;
  }[];
}

export const StudentDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation State
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'academic' | 'preferences' | 'security'>('profile');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Data State
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'week' | 'all'>('month');
  const [myLearningTab, setMyLearningTab] = useState<'COURSES' | 'TOPICS' | 'COMPLETED'>('COURSES');
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>({});
  const [activeDrawer, setActiveDrawer] = useState<'notifications' | 'messages' | null>(null);
  const [copiedPassport, setCopiedPassport] = useState(false);
  const [studentQuizzes, setStudentQuizzes] = useState<QuizItem[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // 1-on-1 Consultation State
  const { success, error: toastError } = useToast();
  const [studentConsultations, setStudentConsultations] = useState<ConsultationBooking[]>([]);
  const [liveSubTab, setLiveSubTab] = useState<'webinars' | 'consultations'>('webinars');
  const [consultationNow, setConsultationNow] = useState(Date.now());
  const [consultationReviewDrafts, setConsultationReviewDrafts] = useState<
    Record<string, { rating: number; review: string }>
  >({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | null>(null);

  const [liveClassesViewMode, setLiveClassesViewMode] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');
  const [completedLiveSessions, setCompletedLiveSessions] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('edtech_student_completed_webinars');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Webinar Notes Modal State
  const [selectedWebinarForNotes, setSelectedWebinarForNotes] = useState<{
    title: string;
    roomCode: string;
    instructorName?: string;
    notes: string;
  } | null>(null);
  const [isLoadingWebinarNotes, setIsLoadingWebinarNotes] = useState(false);
  const [isSavingWebinarNotes, setIsSavingWebinarNotes] = useState(false);
  const [webinarNotesText, setWebinarNotesText] = useState('');
  const [copiedWebinarNotes, setCopiedWebinarNotes] = useState(false);

  const handleOpenStudentWebinarNotes = async (session: any) => {
    const rawUrl = session.meetingUrl || '';
    const roomCode = session.roomCode || (rawUrl.split('/').pop()) || session.sessionId;
    setSelectedWebinarForNotes({
      title: session.title || 'Live Webinar',
      roomCode,
      instructorName: session.instructorName,
      notes: '',
    });
    setWebinarNotesText('');
    setIsLoadingWebinarNotes(true);
    try {
      try {
        const roomRes = await webinarsApi.getLiveRoom(roomCode);
        if (roomRes?.data?.userNotes !== undefined) {
          setWebinarNotesText(roomRes.data.userNotes || '');
          setSelectedWebinarForNotes((prev) => (prev ? { ...prev, notes: roomRes.data.userNotes || '' } : null));
          setIsLoadingWebinarNotes(false);
          return;
        }
      } catch {}

      const res = await webinarsApi.getWebinarById(roomCode);
      if (res?.data) {
        let loaded = '';
        if (typeof (res.data as any).userNotes === 'string') {
          loaded = (res.data as any).userNotes;
        } else if (Array.isArray((res.data as any).userNotes)) {
          const myNote = (res.data as any).userNotes.find((n: any) => n.userId === user?.id || n.userId === (user as any)?._id);
          loaded = myNote?.notes || (res.data as any).userNotes[0]?.notes || '';
        }
        setWebinarNotesText(loaded);
        setSelectedWebinarForNotes((prev) => (prev ? { ...prev, notes: loaded } : null));
      }
    } catch (e) {
      console.warn('Could not load existing notes:', e);
    } finally {
      setIsLoadingWebinarNotes(false);
    }
  };

  const handleSaveStudentWebinarNotes = async () => {
    if (!selectedWebinarForNotes) return;
    setIsSavingWebinarNotes(true);
    try {
      await webinarsApi.saveNotes(selectedWebinarForNotes.roomCode, webinarNotesText);
      try {
        localStorage.setItem(`edtech_webinar_notes_${selectedWebinarForNotes.roomCode}`, webinarNotesText);
        setCompletedLiveSessions((prev) => {
          const exists = prev.some((s) => (s.roomCode === selectedWebinarForNotes.roomCode || s.sessionId === selectedWebinarForNotes.roomCode));
          let updated;
          if (exists) {
            updated = prev.map((s) => (s.roomCode === selectedWebinarForNotes.roomCode || s.sessionId === selectedWebinarForNotes.roomCode) ? { ...s, notes: webinarNotesText } : s);
          } else {
            updated = [{
              sessionId: selectedWebinarForNotes.roomCode,
              roomCode: selectedWebinarForNotes.roomCode,
              title: selectedWebinarForNotes.title,
              instructorName: selectedWebinarForNotes.instructorName || 'Lead Instructor',
              scheduledAt: new Date().toISOString(),
              status: 'COMPLETED',
              type: 'WEBINAR',
              notes: webinarNotesText,
            }, ...prev];
          }
          localStorage.setItem('edtech_student_completed_webinars', JSON.stringify(updated));
          return updated;
        });
      } catch {}
      success('Notes Saved', 'Your workshop notes have been saved.');
    } catch (err: any) {
      toastError('Save Error', err.response?.data?.message || 'Could not save notes.');
    } finally {
      setIsSavingWebinarNotes(false);
    }
  };

  // Course Q&A State
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedCourseForQuestion, setSelectedCourseForQuestion] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionBody, setNewQuestionBody] = useState('');
  const [qnaFilter, setQnaFilter] = useState<'ALL' | 'ANSWERED' | 'PENDING'>('ALL');
  const [qnaSearch, setQnaSearch] = useState('');
  const [questionsList, setQuestionsList] = useState<QnAQuestion[]>([]);
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setInterval(() => setConsultationNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmitConsultationReview = async (bookingId: string) => {
    const draft = consultationReviewDrafts[bookingId];
    if (!draft || draft.rating < 1 || !draft.review.trim()) {
      toastError('Review required', 'Choose a star rating and write a short review.');
      return;
    }

    try {
      setSubmittingReviewId(bookingId);
      const consultationReview = await consultationsApi.submitReview(bookingId, {
        rating: draft.rating,
        review: draft.review.trim(),
      });
      setStudentConsultations((current) =>
        current.map((booking) =>
          booking.id === bookingId ? { ...booking, consultationReview } : booking
        )
      );
      success('Review submitted', 'Thank you for sharing feedback with your mentor.');
    } catch (err: any) {
      toastError(
        'Could not submit review',
        err.response?.data?.message || 'Please try again.'
      );
    } finally {
      setSubmittingReviewId(null);
    }
  };

  // Profile Form Edit State
  const [profileFormData, setProfileFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    headline: '',
    bio: '',
    city: '',
    state: '',
    country: '',
    timezone: 'Asia/Kolkata',
    githubUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    profilePhoto: '',
    institution: '',
    qualification: '',
    graduationYear: '',
    newSkillInput: '',
    skills: [] as string[],
    preferredLanguage: 'English',
    emailNotifications: true,
    webinarReminders: true,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toastError('Profile image size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileFormData((prev) => ({ ...prev, profilePhoto: reader.result as string }));
        success('Photo selected! Click "Save Profile Changes" to save.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Detect route-based initial tab
  useEffect(() => {
    if (location.pathname.includes('/messages') || location.pathname.includes('/qna')) {
      setActiveTab('messages');
    } else if (location.pathname.includes('/profile')) {
      setActiveTab('settings');
      setProfileSubTab('profile');
    } else if (location.pathname.includes('/settings')) {
      setActiveTab('settings');
      setProfileSubTab('security');
    } else if (location.pathname.includes('/notifications')) {
      setActiveDrawer('notifications');
    }
  }, [location.pathname]);

  const passportSlug = user?.firstName
    ? `${user.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${(user.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`
    : (user?._id || 'student');

  const handleCopyPassportLink = () => {
    const url = `${window.location.origin}/passport/${passportSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedPassport(true);
    setTimeout(() => setCopiedPassport(false), 2500);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentDashboard();
      try {
        const notifRes = await notificationsApi.getNotifications();
        if (notifRes?.success && notifRes.data?.activeStartedWebinars?.length) {
          const sessions = data.upcomingLiveSessions ? [...data.upcomingLiveSessions] : [];
          notifRes.data.activeStartedWebinars.forEach((aw: any) => {
            const exists = sessions.some((s: any) => s.sessionId === aw.id || s.webinarId === aw.id || (s.meetingUrl && s.meetingUrl === aw.meetingUrl));
            if (!exists) {
              sessions.unshift({
                sessionId: aw.id,
                webinarId: aw.id,
                title: aw.title,
                description: `Live webinar session in ${aw.category || 'DevOps / Cloud'}`,
                instructorName: 'Lead Instructor',
                scheduledAt: aw.startTime,
                meetingUrl: aw.meetingUrl,
                status: 'LIVE',
                type: 'WEBINAR',
              } as any);
            }
          });
          data.upcomingLiveSessions = sessions;

          // Track in completed/archive list so notes are accessible permanently after the session ends
          try {
            const stored = JSON.parse(localStorage.getItem('edtech_student_completed_webinars') || '[]');
            const updated = [...stored];
            notifRes.data.activeStartedWebinars.forEach((aw: any) => {
              const exists = updated.some((s: any) => s.sessionId === aw.id || s.webinarId === aw.id);
              if (!exists) {
                updated.unshift({
                  sessionId: aw.id,
                  webinarId: aw.id,
                  roomCode: (aw.meetingUrl || '').split('/').pop() || aw.id,
                  title: aw.title,
                  instructorName: 'Lead Instructor',
                  scheduledAt: aw.startTime,
                  status: 'COMPLETED',
                  type: 'WEBINAR',
                });
              }
            });
            localStorage.setItem('edtech_student_completed_webinars', JSON.stringify(updated));
            setCompletedLiveSessions(updated);
          } catch {}
        }
      } catch (e) {
        console.warn('Could not merge active webinars:', e);
      }
      setDashboardData(data);

      if (data?.profile) {
        setProfileFormData({
          firstName: data.profile.firstName || user?.firstName || '',
          lastName: data.profile.lastName || user?.lastName || '',
          phone: data.profile.phone || user?.phone || '',
          headline: data.profile.headline || (user as any)?.headline || '',
          bio: data.profile.bio || (user as any)?.bio || '',
          city: data.profile.city || (user as any)?.city || '',
          state: data.profile.state || (user as any)?.state || '',
          country: data.profile.country || (user as any)?.country || '',
          timezone: data.profile.timezone || (user as any)?.timezone || 'Asia/Kolkata',
          githubUrl: data.profile.githubUrl || (user as any)?.githubUrl || '',
          linkedinUrl: data.profile.linkedinUrl || (user as any)?.linkedinUrl || '',
          websiteUrl: data.profile.websiteUrl || (user as any)?.websiteUrl || '',
          profilePhoto: data.profile.profilePhoto || user?.profilePhoto || '',
          institution: data.profile.institution || (user as any)?.institution || '',
          qualification: data.profile.qualification || (user as any)?.qualification || '',
          graduationYear: data.profile.graduationYear ? String(data.profile.graduationYear) : '',
          newSkillInput: '',
          skills: data.profile.skills && data.profile.skills.length > 0 ? data.profile.skills : (user?.skills || []),
          preferredLanguage: data.profile.preferredLanguage || 'English',
          emailNotifications: true,
          webinarReminders: true,
        });
      }

      // Populate student's actual asked questions (empty if student has asked none yet)
      if (data?.questions && Array.isArray(data.questions)) {
        setQuestionsList(data.questions);
      } else {
        setQuestionsList([]);
      }

      if (data?.activeCourses && Array.isArray(data.activeCourses)) {
        try {
          // Tag with the owner so another account in the same window never inherits it.
          const ownerId = (user as any)?._id || (user as any)?.id || null;
          const enrolledList = data.activeCourses.map((c: any) => ({
            id: c.id || c._id,
            slug: c.slug,
            userId: ownerId,
          }));
          sessionStorage.setItem('edtech_student_enrolled_courses', JSON.stringify(enrolledList));
        } catch {
          // ignore
        }
      }

      if (data?.wishlist) {
        const initialWishMap: Record<string, boolean> = {};
        data.wishlist.forEach((w) => {
          if (w?.productId) {
            initialWishMap[w.productId] = true;
          }
        });
        setWishlistState(initialWishMap);
      }

      // Fetch Quizzes for enrolled courses
      if (data?.activeCourses && Array.isArray(data.activeCourses) && data.activeCourses.length > 0) {
        try {
          const quizPromises = data.activeCourses.map((c) =>
            quizzesApi.getQuizzesByCourse(c.courseId || (c as any).id || (c as any)._id).catch(() => ({ data: [] }))
          );
          const quizResults = await Promise.all(quizPromises);
          const allQuizzes = quizResults.flatMap((r) => (r.data ? r.data : []));
          setStudentQuizzes(allQuizzes);
        } catch (quizErr) {
          console.warn('Could not load course quizzes:', quizErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Unable to load dashboard. Please try again.';
      if (errMsg.includes('Refresh token required') || errMsg.includes('jwt expired') || err?.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    consultationsApi
      .getMyConsultations()
      .then((list) => setStudentConsultations(list || []))
      .catch((err) => console.warn('Consultations load warning:', err));
  }, []);

  // Handle Return from Cashfree PG for Consultation Booking
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cnsOrderId = params.get('cns_order_id');
    if (cnsOrderId) {
      consultationsApi
        .verifyPayment({ orderId: cnsOrderId })
        .then((res) => {
          if (res.success) {
            success('Consultation Confirmed', 'Your 1-on-1 mentorship session is confirmed!');
            setActiveTab('mentorship');
            consultationsApi.getMyConsultations().then((list) => setStudentConsultations(list || []));
          }
        })
        .catch((err) => {
          console.warn('Payment check warning:', err);
        });
    }
  }, [location.search]);

  // Dynamic Greeting based on local system time
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', emoji: '☀️' };
    }
    if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', emoji: '🌤️' };
    }
    if (hour >= 17 && hour < 21) {
      return { text: 'Good evening', emoji: '🌆' };
    }
    return { text: 'Good night', emoji: '🌙' };
  }, []);

  // Primary active course to feature in "Continue Learning"
  const primaryCourse: ActiveEnrolledCourse | null = useMemo(() => {
    if (!dashboardData?.activeCourses || dashboardData.activeCourses.length === 0) return null;
    return dashboardData.activeCourses[0];
  }, [dashboardData]);

  // Wishlist Toggle Handler
  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId) return;
    try {
      setWishlistState((prev) => ({ ...prev, [productId]: !prev[productId] }));
      await toggleWishlist(productId, 'COURSE');
      const refreshed = await getStudentDashboard();
      if (refreshed?.wishlist) {
        setDashboardData((prev) => (prev ? { ...prev, wishlist: refreshed.wishlist } : prev));
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      setWishlistState((prev) => ({ ...prev, [productId]: !prev[productId] }));
    }
  };

  // Add to cart handler
  const handleAddToCart = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!courseId) return;
    setAddingCourseId(courseId);
    try {
      const res = await addToCart(courseId, 'COURSE');
      if (res?.success) {
        navigate('/cart');
      }
    } catch (err) {
      console.error('Failed to add course to cart:', err);
    } finally {
      setAddingCourseId(null);
    }
  };

  // Handle Asking New Doubt / Question
  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTitle.trim() || !newQuestionBody.trim()) return;

    const courseObj = dashboardData?.activeCourses?.find(
      (c) => c.courseId === selectedCourseForQuestion || c.title === selectedCourseForQuestion
    ) || dashboardData?.activeCourses?.[0];

    const slug = courseObj?.slug;
    const combinedQuestion = newQuestionTitle.trim() === newQuestionBody.trim()
      ? newQuestionTitle.trim()
      : `${newQuestionTitle.trim()}\n\n${newQuestionBody.trim()}`;

    try {
      if (slug) {
        await coursesApi.askQuestion(slug, {
          question: combinedQuestion,
        });
      }
      success('Question posted to instructor successfully!');
    } catch (err: any) {
      console.warn('Could not post question to backend:', err);
    }

    const createdQ: QnAQuestion = {
      id: `qna-${Date.now()}`,
      courseTitle: courseObj?.title || 'General Course Discussion',
      courseId: courseObj?.courseId || 'general',
      topicTitle: courseObj?.lastAccessedLesson?.title || 'Current Module',
      questionTitle: newQuestionTitle.trim(),
      questionBody: newQuestionBody.trim(),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      answers: [],
    };

    setQuestionsList((prev) => [createdQ, ...prev]);
    setNewQuestionTitle('');
    setNewQuestionBody('');
    setIsAskModalOpen(false);
  };

  // Handle Posting Follow-up / Student Reply
  const handleAddReply = (questionId: string) => {
    const text = replyInputMap[questionId];
    if (!text || !text.trim()) return;

    setQuestionsList((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: [
              ...q.answers,
              {
                instructorName: studentName || 'Student',
                answerText: text.trim(),
                answeredAt: new Date().toISOString(),
              },
            ],
          };
        }
        return q;
      })
    );

    setReplyInputMap((prev) => ({ ...prev, [questionId]: '' }));
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveSuccess(false);
    try {
      const payload: Record<string, any> = {
        firstName: profileFormData.firstName,
        lastName: profileFormData.lastName,
        phone: profileFormData.phone,
        headline: profileFormData.headline,
        bio: profileFormData.bio,
        city: profileFormData.city,
        state: profileFormData.state,
        country: profileFormData.country,
        profilePhoto: profileFormData.profilePhoto || undefined,
        githubUrl: profileFormData.githubUrl,
        linkedinUrl: profileFormData.linkedinUrl,
        websiteUrl: profileFormData.websiteUrl,
        timezone: profileFormData.timezone,
        institution: profileFormData.institution,
        qualification: profileFormData.qualification,
        graduationYear: profileFormData.graduationYear ? Number(profileFormData.graduationYear) : undefined,
        skills: profileFormData.skills,
        preferredLanguage: profileFormData.preferredLanguage,
      };

      await authApi.updateMe(payload);
      updateUser(payload);
      setProfileSaveSuccess(true);
      success('Profile and account details saved successfully!');
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toastError('Failed to save profile changes. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const studentName = dashboardData?.profile?.firstName
    ? `${dashboardData.profile.firstName} ${dashboardData.profile.lastName || ''}`.trim()
    : `${user?.firstName || 'Student'} ${user?.lastName || ''}`.trim();

  const studentFirstName = dashboardData?.profile?.firstName || user?.firstName || 'Student';
  const studentEmail = dashboardData?.profile?.email || user?.email || 'student@example.com';
  const profilePhoto = dashboardData?.profile?.profilePhoto || user?.profilePhoto;
  const completionPercentage = dashboardData?.profile?.completionPercentage ?? 0;
  const currentStreak = dashboardData?.streak?.currentStreak ?? 0;

  const stats = dashboardData?.stats || {
    activeCoursesCount: 0,
    purchasedTopicsCount: 0,
    completedCoursesCount: 0,
    certificatesCount: 0,
    totalLearningHours: 0,
  };

  const primaryUpgrade = dashboardData?.upgradeOpportunities?.[0];

  // Navigation Items Specification
  const navItems: { id: StudentTab; label: string; icon: React.FC<{ className?: string }>; badge?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-learning', label: 'My Learning', icon: BookOpen, badge: stats.activeCoursesCount || undefined },
    { id: 'live-classes', label: 'Live Classes', icon: Video, badge: dashboardData?.upcomingLiveSessions?.length || undefined },
    { id: 'mentorship', label: '1-on-1 Mentorship', icon: UserCheck, badge: studentConsultations.filter(c => c.status === 'CONFIRMED' && new Date(c.endTime).getTime() > consultationNow).length || undefined },
    { id: 'assessments', label: 'Assessments', icon: HelpCircle, badge: studentQuizzes.length || undefined },
    { id: 'passport', label: 'Skill Passport', icon: ShieldCheck },
    { id: 'certificates', label: 'Certificates', icon: Award, badge: stats.certificatesCount || undefined },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: dashboardData?.wishlist?.length || undefined },
    { id: 'orders', label: 'Orders', icon: CreditCard },
    { id: 'messages', label: 'Course Q&A', icon: MessageSquare, badge: questionsList.length || undefined },
    { id: 'settings', label: 'Profile & Settings', icon: UserIcon },
  ];

  // Filtered Q&A questions
  const filteredQuestions = useMemo(() => {
    return questionsList.filter((q) => {
      const matchFilter = qnaFilter === 'ALL' || q.status === qnaFilter;
      const matchSearch =
        !qnaSearch.trim() ||
        q.questionTitle.toLowerCase().includes(qnaSearch.toLowerCase()) ||
        q.courseTitle.toLowerCase().includes(qnaSearch.toLowerCase()) ||
        q.questionBody.toLowerCase().includes(qnaSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [questionsList, qnaFilter, qnaSearch]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-[#FA5A36] selection:text-white">
      <Navbar />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 gap-5">
        {/* ========================================================
            1. LEFT COLLAPSIBLE SIDEBAR
           ======================================================== */}
        <aside
          className={`hidden md:flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-xs transition-all duration-300 relative z-20 shrink-0 ${
            sidebarCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-4'
          }`}
        >
          {/* Sidebar Header & Collapse Toggle */}
          <div className={`flex items-center justify-between pb-4 border-b border-slate-100 w-full mb-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-xl bg-[#FA5A36] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-900 tracking-tight">Student Portal</h2>
                  <p className="text-[10px] text-slate-400 font-semibold">Learning Hub</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 w-full overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer relative group ${
                    isActive
                      ? 'bg-[#FA5A36] text-white shadow-xs shadow-[#FA5A36]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Upgrade CTA (Only shown if upgrade opportunities exist) */}
          {primaryUpgrade && (
            <div className={`mt-auto pt-3 border-t border-slate-100 w-full ${sidebarCollapsed ? 'px-0' : ''}`}>
              {!sidebarCollapsed ? (
                <div className="p-3.5 bg-gradient-to-br from-[#FFF5F2] to-orange-50/60 rounded-2xl border border-[#FFCCC2] space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FA5A36] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 truncate">Upgrade Available</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Credit applied: <strong className="text-[#FA5A36] font-bold">₹{primaryUpgrade.accumulatedCredit || 0} off</strong>
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await addToCart(primaryUpgrade.courseId, 'COURSE');
                        navigate('/cart');
                      } catch {
                        navigate(`/course/${primaryUpgrade.courseSlug}`);
                      }
                    }}
                    className="w-full py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Upgrade Now →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-10 h-10 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center hover:bg-[#FFF5F2] transition mx-auto cursor-pointer"
                  title="Upgrade Available"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </aside>

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-white h-full p-4 flex flex-col shadow-2xl z-10 border-r border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FA5A36] text-white flex items-center justify-center font-black text-sm">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h2 className="text-xs font-black text-slate-900">Student Portal</h2>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition ${
                        isActive ? 'bg-[#FA5A36] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* ========================================================
            2. MAIN CONTENT AREA
           ======================================================== */}
        <main className="flex-1 flex flex-col min-w-0 space-y-5 pb-20 min-[501px]:pb-0">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 sm:px-6 rounded-3xl border border-slate-200/80 shadow-xs">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition-all"
              />
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Learning Streak Pill */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-xl"
                title={`${currentStreak} days learning streak`}
              >
                <span className="text-xs">🔥</span>
                <span className="text-xs font-black text-amber-900">{currentStreak} days</span>
              </div>

              {/* Notifications Bell */}
              <button
                onClick={() => setActiveDrawer('notifications')}
                className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {((Array.isArray(dashboardData?.notifications)
                  ? dashboardData.notifications.length
                  : (dashboardData?.notifications as any)?.unreadCount || 0) > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                    {Array.isArray(dashboardData?.notifications)
                      ? dashboardData.notifications.length
                      : (dashboardData?.notifications as any)?.unreadCount || 0}
                  </span>
                )}
              </button>

              {/* Messages & Q&A Button */}
              <button
                onClick={() => setActiveTab('messages')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                title="Course Q&A & Doubts"
              >
                <Mail className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

              {/* Profile Dropdown */}
              <div className="relative">
                <div
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 cursor-pointer transition"
                >
                  {profilePhoto ? (
                    <img
                      src={normalizeImageUrl(profilePhoto) || ''}
                      alt={studentName}
                      className="w-7 h-7 rounded-lg object-cover border border-white shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-[#FA5A36] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {studentName[0]?.toUpperCase() || 'S'}
                    </div>
                  )}
                  <div className="text-left leading-tight hidden lg:block">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{studentName}</p>
                    <p className="text-[10px] font-semibold text-slate-400">Student</p>
                  </div>
                </div>

                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl p-2 z-50 space-y-1">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-black text-slate-900 truncate">{studentName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{studentEmail}</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setProfileSubTab('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile & Settings</span>
                      </button>
                      <button
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <LiveStartedBanner />

          {/* Loading & Error States */}
          {loading ? (
            <DashboardSkeleton />
          ) : error ? (
            <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-xs text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Dashboard Unavailable</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={fetchDashboardData}
                  className="px-5 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
                {error.includes('expired') && (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Go to Login
                  </button>
                )}
              </div>
            </div>
          ) : dashboardData ? (
            <>
              {/* ========================================================
                  TAB 1: DASHBOARD OVERVIEW
                 ======================================================== */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Mandatory Profile Completion Alert Banner */}
                  {!user?.isProfileCompleted && (
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-[#FFF5F2] border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              Action Required: Complete Your Student Profile
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                              Required
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Verify your college, degree, phone, and skills to unlock genuine course certificates and activate your Verified Skill Passport.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setProfileSubTab('profile');
                        }}
                        className="px-4 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <span>Complete Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 1. EXPANDED WELCOME BOX WITH DYNAMIC TIME-AWARE GREETING */}
                  <div className="bg-gradient-to-br from-[#FFF5F2] via-orange-50/60 to-amber-50/40 border border-[#FFCCC2] rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="space-y-2 z-10 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-[#FFCCC2] text-[#FA5A36] text-xs font-bold mb-1 shadow-2xs">
                        <span>{dynamicGreeting.emoji}</span>
                        <span>{dynamicGreeting.text}</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {dynamicGreeting.text}, {studentFirstName}! 👋
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        Keep learning, keep growing. Continue your learning journey and build your skills with industry-led topics.
                      </p>

                      <div className="pt-3 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => navigate('/courses')}
                          className="px-4 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FA5A36]/20 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Explore Courses</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveTab('my-learning')}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 shadow-2xs transition cursor-pointer"
                        >
                          My Learning Library
                        </button>
                      </div>
                    </div>

                    {/* Right Streak Showcase Pill */}
                    <div className="hidden sm:flex flex-col items-center justify-center p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-[#FFCCC2] shadow-sm min-w-[140px] text-center z-10">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Streak</span>
                      <div className="flex items-center justify-center gap-1 my-1">
                        <span className="text-xl font-black text-slate-900">{currentStreak}</span>
                        <span className="text-base">🔥</span>
                      </div>
                      <span className="text-[11px] text-[#FA5A36] font-bold">Days Active</span>
                    </div>

                    {/* Subtle decorative glow */}
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#FA5A36]/10 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* Mobile Streak Showcase Card (<= 500px) */}
                  <div className="flex min-[501px]:hidden items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🔥</span>
                      <div>
                        <span className="text-xs font-black text-amber-950 block">{currentStreak} days</span>
                        <span className="text-[10px] text-slate-500 font-medium">Current Streak</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-700" />
                  </div>

                  {/* 2. REDESIGNED LEARNING OVERVIEW: 4 HORIZONTAL METRIC CARDS ROW (2-Cols on <= 500px) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Metrics</h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <span>Filter:</span>
                        <select
                          value={selectedTimeframe}
                          onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                          className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer shadow-2xs"
                        >
                          <option value="month">This Month</option>
                          <option value="week">This Week</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                      {/* Metric 1: Active Courses */}
                      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-[#FFCCC2] hover:shadow-sm transition flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                            {stats.activeCoursesCount}
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-500">Active Courses</span>
                        </div>
                      </div>

                      {/* Metric 2: Topics Owned */}
                      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-amber-200 hover:shadow-sm transition flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                            {stats.purchasedTopicsCount}
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-500">Topics Owned</span>
                        </div>
                      </div>

                      {/* Metric 3: Completed Courses */}
                      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-sm transition flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                            {stats.completedCoursesCount}
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-500">Completed Courses</span>
                        </div>
                      </div>

                      {/* Metric 4: Certificates */}
                      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-[#FFCCC2] hover:shadow-sm transition flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0">
                          <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
                            {stats.certificatesCount}
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-500">Certificates Earned</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4 & 5: Continue Learning | Upcoming Live Classes */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Section 4: Continue Learning (7 cols) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 fill-[#FA5A36]" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">Continue Learning</h3>
                        </div>
                        {dashboardData.activeCourses && dashboardData.activeCourses.length > 1 && (
                          <button
                            onClick={() => setActiveTab('my-learning')}
                            className="text-xs font-bold text-[#FA5A36] hover:text-[#E04322] flex items-center gap-1 cursor-pointer"
                          >
                            View All <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {primaryCourse ? (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                          <div className="sm:col-span-5 relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-100 group shadow-inner">
                            {primaryCourse.thumbnail ? (
                              <img
                                src={primaryCourse.thumbnail}
                                alt={primaryCourse.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-[#FA5A36]" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                              <button
                                onClick={() => navigate(`/course/${primaryCourse.slug}`)}
                                className="w-10 h-10 rounded-full bg-[#FA5A36]/90 hover:bg-[#FA5A36] text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </button>
                            </div>
                            {primaryCourse.lastAccessedLesson?.duration && (
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold rounded">
                                {primaryCourse.lastAccessedLesson.duration}
                              </span>
                            )}
                          </div>

                          <div className="sm:col-span-7 space-y-3">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm truncate">{primaryCourse.title}</h4>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {primaryCourse.lastAccessedLesson?.title
                                  ? `Current Topic: ${primaryCourse.lastAccessedLesson.title}`
                                  : `Enrolled: ${primaryCourse.enrolledTopicsCount || 0} of ${primaryCourse.totalCourseTopicsCount || 0} topics`}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-slate-500">Course Progress</span>
                                <span className="text-[#FA5A36] font-black">{primaryCourse.entitledProgressPercentage || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#FA5A36] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${primaryCourse.entitledProgressPercentage || 0}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => navigate(`/course/${primaryCourse.slug}`)}
                              className="w-full py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>Continue Learning</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-2">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-500">No active courses yet.</p>
                          <button
                            onClick={() => navigate('/courses')}
                            className="px-4 py-2 bg-[#FA5A36] text-white text-xs font-bold rounded-xl"
                          >
                            Explore Courses
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section 5: Upcoming Live Classes (5 cols) */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <Video className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">Upcoming Live Classes</h3>
                        </div>
                        {dashboardData.upcomingLiveSessions && dashboardData.upcomingLiveSessions.length > 2 && (
                          <button
                            onClick={() => setActiveTab('live-classes')}
                            className="text-xs font-bold text-[#FA5A36] hover:text-[#E04322] flex items-center gap-1 cursor-pointer"
                          >
                            View All <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {dashboardData.upcomingLiveSessions && dashboardData.upcomingLiveSessions.length > 0 ? (
                        <div className="space-y-2.5">
                          {dashboardData.upcomingLiveSessions.slice(0, 2).map((session, idx) => (
                            <div
                              key={session.sessionId || idx}
                              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-[#FFCCC2] transition"
                            >
                              <div className="space-y-0.5 truncate">
                                <div className="flex items-center gap-1.5">
                                  {idx === 0 && (
                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded uppercase tracking-wider">
                                      LIVE
                                    </span>
                                  )}
                                  <h4 className="font-bold text-slate-900 text-xs truncate">{session.title}</h4>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {session.scheduledAt
                                    ? `${new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                                    : 'Upcoming'}
                                </p>
                                <p className="text-[10px] text-slate-400">Instructor: {session.instructorName || 'Lead Instructor'}</p>
                              </div>

                              <button
                                onClick={() => {
                                  if (session.meetingUrl) {
                                    window.open(session.meetingUrl, '_blank');
                                  } else {
                                    navigate('/webinars');
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition ${
                                  idx === 0
                                    ? 'bg-[#FA5A36] hover:bg-[#E04322] text-white shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {idx === 0 ? 'Join Class' : 'Details'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 space-y-1">
                          <Video className="w-7 h-7 text-slate-300 mx-auto" />
                          <p className="text-xs text-slate-500">No upcoming live classes.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 6 & 7: My Learning Summary & Upgrade Opportunity */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Section 6: My Learning Summary */}
                    <div
                      className={`${
                        dashboardData.upgradeOpportunities && dashboardData.upgradeOpportunities.length > 0
                          ? 'lg:col-span-7'
                          : 'lg:col-span-12'
                      } bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">My Learning</h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('my-learning')}
                          className="text-xs font-bold text-[#FA5A36] hover:text-[#E04322] flex items-center gap-1 cursor-pointer"
                        >
                          View All <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {dashboardData.activeCourses && dashboardData.activeCourses.length > 0 ? (
                        <div className="space-y-2.5">
                          {dashboardData.activeCourses.slice(0, 3).map((course) => (
                            <div
                              key={course.courseId}
                              onClick={() => navigate(`/course/${course.slug}`)}
                              className="p-3 bg-slate-50 hover:bg-[#FFF5F2]/60 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 cursor-pointer transition"
                            >
                              <div className="flex items-center gap-3 truncate">
                                {course.thumbnail ? (
                                  <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-100"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="truncate">
                                  <h4 className="font-bold text-slate-900 text-xs truncate">{course.title}</h4>
                                  <p className="text-[10px] text-slate-400">
                                    {course.totalCourseTopicsCount || 0} topics • {course.enrolledTopicsCount || 0} purchased
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="font-bold text-xs text-[#FA5A36]">
                                  {course.entitledProgressPercentage || 0}%
                                </span>
                                <span className="text-xs font-bold text-slate-500">Continue →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-400">
                          No courses in progress. Explore our catalog to start learning.
                        </div>
                      )}
                    </div>

                    {/* Section 7: Upgrade Opportunity (Shown ONLY if upgrade opportunities exist) */}
                    {dashboardData.upgradeOpportunities && dashboardData.upgradeOpportunities.length > 0 && (
                      <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase">
                            Topic Credit Available
                          </span>
                          <Zap className="w-4 h-4 text-amber-400" />
                        </div>

                        <div>
                          <h4 className="font-black text-white text-sm truncate">{dashboardData.upgradeOpportunities[0].courseTitle}</h4>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Upgrade to full course and deduct {dashboardData.upgradeOpportunities[0].eligibleTopicCount} purchased topics.
                          </p>
                        </div>

                        <div className="p-3 bg-white/10 rounded-2xl space-y-1 text-xs text-slate-200">
                          <div className="flex justify-between">
                            <span>Full Course Price</span>
                            <span className="font-bold text-white">₹{(dashboardData.upgradeOpportunities[0].fullCoursePrice || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-amber-300">
                            <span>Topic Credit</span>
                            <span className="font-bold">-₹{(dashboardData.upgradeOpportunities[0].accumulatedCredit || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black pt-1 border-t border-white/10 text-white">
                            <span>Pay Only</span>
                            <span className="text-emerald-400">₹{(dashboardData.upgradeOpportunities[0].upgradePrice || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              await addToCart(dashboardData.upgradeOpportunities[0].courseId, 'COURSE');
                              navigate('/cart');
                            } catch {
                              navigate(`/course/${dashboardData.upgradeOpportunities[0].courseSlug}`);
                            }
                          }}
                          className="w-full py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                        >
                          Upgrade Now →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section 8: Recently Earned Certificates */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Recently Earned Certificates</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('certificates')}
                        className="text-xs font-bold text-[#FA5A36] hover:text-[#E04322] flex items-center gap-1 cursor-pointer"
                      >
                        View All <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {dashboardData.recentCertificates && dashboardData.recentCertificates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dashboardData.recentCertificates.slice(0, 2).map((cert) => (
                          <div
                            key={cert.certificateId}
                            className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <Award className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <h4 className="font-bold text-slate-900 text-xs truncate">
                                  {cert.courseTitle || 'Course Certificate'}
                                </h4>
                                <p className="text-[10px] text-slate-400">
                                  Issued on {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {cert.certificateAssetUrl && (
                                <button
                                  onClick={() => window.open(cert.certificateAssetUrl as string, '_blank')}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition"
                                >
                                  View
                                </button>
                              )}
                              <button
                                onClick={() => navigate(cert.verificationUrl || `/verify/${cert.certificateNumber}`)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] rounded-lg transition"
                              >
                                Verify
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No certificates yet. Complete all lessons and quizzes in an enrolled course to earn your verified credential.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 2: MY LEARNING VIEW
                 ======================================================== */}
              {activeTab === 'my-learning' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-slate-900">My Learning Library</h2>
                      <p className="text-xs text-slate-500">Access your enrolled courses, purchased modules, and completed milestones.</p>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold overflow-x-auto no-scrollbar max-w-full">
                      <button
                        onClick={() => setMyLearningTab('COURSES')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg transition ${
                          myLearningTab === 'COURSES' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Enrolled ({stats.activeCoursesCount})
                      </button>
                      <button
                        onClick={() => setMyLearningTab('TOPICS')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg transition ${
                          myLearningTab === 'TOPICS' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Purchased Topics ({stats.purchasedTopicsCount})
                      </button>
                      <button
                        onClick={() => setMyLearningTab('COMPLETED')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-lg transition ${
                          myLearningTab === 'COMPLETED' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Completed ({stats.completedCoursesCount})
                      </button>
                    </div>
                  </div>

                  {dashboardData.activeCourses && dashboardData.activeCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboardData.activeCourses.map((course) => (
                        <div
                          key={course.courseId}
                          className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex flex-col justify-between hover:border-[#FFCCC2] transition group"
                        >
                          <div className="aspect-video bg-slate-900 relative overflow-hidden">
                            {course.thumbnail ? (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-[#FA5A36]">
                                <BookOpen className="w-10 h-10" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                              {course.enrolledTopicsCount || 0}/{course.totalCourseTopicsCount || 0} topics
                            </div>
                          </div>

                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h3 className="font-extrabold text-slate-900 text-xs line-clamp-1">{course.title}</h3>
                              <p className="text-[11px] text-slate-500">Instructor: {course.instructorName || 'Lead Instructor'}</p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-500">Progress</span>
                                <span className="text-[#FA5A36]">{course.entitledProgressPercentage || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#FA5A36] h-full rounded-full"
                                  style={{ width: `${course.entitledProgressPercentage || 0}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => navigate(`/course/${course.slug}`)}
                              className="w-full py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Resume Learning
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">No courses in your library yet</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Explore expert-led courses across development, security, and cloud architectures.
                      </p>
                      <button
                        onClick={() => navigate('/courses')}
                        className="px-5 py-2 bg-[#FA5A36] text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Explore Courses
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 3: LIVE CLASSES & 1-ON-1 CONSULTATIONS VIEW
                 ======================================================== */}
              {/* ========================================================
                  TAB 3: LIVE WEBINARS / CLASSES VIEW
                 ======================================================== */}
              {activeTab === 'live-classes' && (
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Live Classes & Webinars</h2>
                      <p className="text-xs text-slate-500">Join interactive live webinar sessions and review your workshop notes anytime.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/webinars')}
                      className="shrink-0 whitespace-nowrap px-3.5 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Explore Webinars</span>
                    </button>
                  </div>

                  {/* Sub-tabs: Upcoming & Live vs Completed Sessions & Notes */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <button
                      type="button"
                      onClick={() => setLiveClassesViewMode('UPCOMING')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        liveClassesViewMode === 'UPCOMING'
                          ? 'bg-[#FA5A36] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Upcoming & Live ({dashboardData.upcomingLiveSessions?.length || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveClassesViewMode('COMPLETED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        liveClassesViewMode === 'COMPLETED'
                          ? 'bg-[#FA5A36] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Completed Classes & Notes ({completedLiveSessions.length})</span>
                    </button>
                  </div>

                  {liveClassesViewMode === 'UPCOMING' ? (
                    dashboardData.upcomingLiveSessions && dashboardData.upcomingLiveSessions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dashboardData.upcomingLiveSessions.map((session, idx) => (
                          <div
                            key={session.sessionId || idx}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded uppercase">
                                  Scheduled Live
                                </span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : 'Upcoming'}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-sm">{session.title}</h3>
                              <p className="text-xs text-slate-600">{session.description || 'Interactive hands-on session with live Q&A.'}</p>
                              <p className="text-xs font-bold text-[#FA5A36]">Instructor: {session.instructorName || 'Lead Instructor'}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStudentWebinarNotes(session)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                  title="View & Edit Session Notes"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                  <span>My Notes</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (session.meetingUrl) {
                                      window.open(session.meetingUrl, '_blank');
                                    } else {
                                      navigate('/webinars');
                                    }
                                  }}
                                  className="px-4 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                                >
                                  Join Class
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-2">
                        <Video className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No live classes scheduled</h3>
                        <p className="text-xs text-slate-400">Upcoming webinars and mentor sessions will appear here.</p>
                      </div>
                    )
                  ) : (
                    /* COMPLETED SESSIONS & NOTES VIEW */
                    completedLiveSessions && completedLiveSessions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedLiveSessions.map((session, idx) => (
                          <div
                            key={session.sessionId || idx}
                            className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Completed</span>
                                </span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : 'Past'}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-sm">{session.title}</h3>
                              <p className="text-xs text-slate-500">Live webinar session completed. Your private workshop notes remain permanently accessible.</p>
                              <p className="text-xs font-bold text-slate-600">Instructor: {session.instructorName || 'Lead Instructor'}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                <FileText className="w-3 h-3" />
                                <span>Notes Saved</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenStudentWebinarNotes(session)}
                                className="px-3.5 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                                title="View & Edit Session Notes"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>My Notes</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-2">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No completed sessions yet</h3>
                        <p className="text-xs text-slate-400">When your live classes finish, they will appear here with all your private notes and takeaways.</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB: 1-ON-1 MENTORSHIP VIEW
                 ======================================================== */}
              {activeTab === 'mentorship' && (
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FA5A36] text-[10px] font-black uppercase tracking-wider mb-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Private Mentorship</span>
                      </div>
                      <h2 className="text-base font-black text-slate-900">1-on-1 Mentorship Sessions</h2>
                      <p className="text-xs text-slate-500">Your scheduled and completed private consultation sessions with senior IT mentors.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/mentorship')}
                      className="shrink-0 whitespace-nowrap px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span>Book New Session</span>
                    </button>
                  </div>

                  <div>
                    {studentConsultations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studentConsultations.map((c) => (
                          <div
                            key={c.id}
                            className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                                  {c.status}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 font-semibold">
                                  {c.bookingCode}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FA5A36] to-[#FF8A65] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                  {c.instructor?.profilePhoto ? (
                                    <img
                                      src={c.instructor.profilePhoto}
                                      alt={c.instructor.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    c.instructor?.name?.[0] || 'M'
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <h4 className="text-xs font-black text-slate-900 truncate">
                                    {c.instructor?.name || 'Mentor'}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 truncate font-medium">
                                    {c.instructor?.headline || 'Working IT Professional'}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date:
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {new Date(c.startTime).toLocaleDateString('en-IN', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Time:
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {new Date(c.startTime).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}{' '}
                                    ({c.durationMinutes} mins)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">Fee:</span>
                                  <span className="font-black text-slate-900">
                                    ₹{c.fee} {c.paymentStatus === 'FREE' ? '(Free)' : '(Paid)'}
                                  </span>
                                </div>
                              </div>

                              {c.notes && (
                                <p className="text-[11px] text-slate-500 bg-slate-100/60 p-2 rounded-lg italic line-clamp-2">
                                  " {c.notes} "
                                </p>
                              )}
                            </div>

                            {(() => {
                              const completed =
                                c.isCompleted ||
                                c.status === 'ATTENDED' ||
                                new Date(c.endTime).getTime() <= consultationNow;
                              const draft = consultationReviewDrafts[c.id] || { rating: 0, review: '' };

                              return (
                                <div className="pt-3 border-t border-slate-200/70 space-y-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className={`text-[11px] font-bold flex items-center gap-1 ${completed ? 'text-slate-600' : 'text-emerald-600'}`}>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      {completed ? 'Session completed' : 'Confirmed'}
                                    </span>
                                    {!completed && c.meetingRoomCode && (
                                      <button
                                        onClick={() => navigate(`/webinars/live/${c.meetingRoomCode}`)}
                                        className="px-4 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        <span>Enter Session</span>
                                      </button>
                                    )}
                                  </div>

                                  {c.consultationReview ? (
                                    <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 space-y-1.5">
                                      <div className="flex items-center gap-1" aria-label={`Your rating: ${c.consultationReview.rating} out of 5`}>
                                        {Array.from({ length: 5 }, (_, index) => (
                                          <Star
                                            key={index}
                                            className={`w-4 h-4 ${index < c.consultationReview!.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                                          />
                                        ))}
                                        <span className="ml-1 text-[10px] font-bold text-slate-600">Your review</span>
                                      </div>
                                      <p className="text-xs text-slate-700">{c.consultationReview.review}</p>
                                    </div>
                                  ) : completed && c.status !== 'CANCELLED' ? (
                                    <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 space-y-2.5">
                                      <p className="text-xs font-bold text-slate-800">How was your 1-on-1 with {c.instructor?.name || 'your mentor'}?</p>
                                      <div className="flex items-center gap-1" role="group" aria-label="Rate your consultation">
                                        {Array.from({ length: 5 }, (_, index) => {
                                          const rating = index + 1;
                                          return (
                                            <button
                                              key={rating}
                                              type="button"
                                              aria-pressed={draft.rating === rating}
                                              aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                                              onClick={() =>
                                                setConsultationReviewDrafts((current) => ({
                                                  ...current,
                                                  [c.id]: { ...draft, rating },
                                                }))
                                              }
                                              className="p-0.5 cursor-pointer"
                                            >
                                              <Star className={`w-5 h-5 ${rating <= draft.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <textarea
                                        value={draft.review}
                                        maxLength={2000}
                                        onChange={(event) =>
                                          setConsultationReviewDrafts((current) => ({
                                            ...current,
                                            [c.id]: { ...draft, review: event.target.value },
                                          }))
                                        }
                                        placeholder="Share your experience with this mentor..."
                                        rows={3}
                                        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#FA5A36]"
                                      />
                                      <button
                                        type="button"
                                        disabled={submittingReviewId === c.id || draft.rating < 1 || !draft.review.trim()}
                                        onClick={() => handleSubmitConsultationReview(c.id)}
                                        className="px-3.5 py-2 rounded-lg bg-[#FA5A36] text-white text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {submittingReviewId === c.id ? 'Submitting...' : 'Submit review'}
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <div className="w-12 h-12 bg-orange-50 text-[#FA5A36] rounded-2xl flex items-center justify-center mx-auto">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No 1-on-1 Consultations Booked</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                          Connect with experienced senior engineers and IT instructors for personalized code reviews, career guidance, and architecture deep dives.
                        </p>
                        <button
                          onClick={() => navigate('/mentorship')}
                          className="px-4 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Browse Available Mentors</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 4: ASSESSMENTS / QUIZZES VIEW
                 ======================================================== */}
              {activeTab === 'assessments' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Assessments & Knowledge Checks</h2>
                      <p className="text-xs text-slate-500">Test your mastery of enrolled course modules with interactive checkpoints.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#FFF5F2] text-[#FA5A36] text-xs font-bold">
                      {studentQuizzes.length} Available
                    </span>
                  </div>

                  {studentQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studentQuizzes.map((quiz) => (
                        <div
                          key={quiz._id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#FA5A36] truncate">
                                {quiz.courseId?.title || 'Enrolled Course'}
                              </span>
                              {quiz.hasPassed ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                                  Passed ({quiz.bestScore}%)
                                </span>
                              ) : quiz.bestScore !== null ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                  Score: {quiz.bestScore}%
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold">
                                  Not Attempted
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs font-extrabold text-slate-900 line-clamp-1">{quiz.title}</h3>
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {quiz.description || 'Module assessment with instant score validation.'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold">
                              {quiz.duration || 15}m • Pass: {quiz.passingScore || 70}%
                            </span>
                            <button
                              onClick={() => setActiveQuizId(quiz._id)}
                              className="px-3 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              {quiz.hasPassed ? 'Retake Quiz' : 'Start Quiz'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">No quizzes available</h3>
                      <p className="text-xs text-slate-400">Assessments published by your instructors will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 5: SKILL PASSPORT VIEW
                 ======================================================== */}
              {activeTab === 'passport' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl z-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Verified Skill Passport
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FA5A36]/20 text-[#FFCCC2] border border-[#FA5A36]/40 text-xs font-mono font-bold">
                          ID: STU-{user?._id?.toString().slice(-6).toUpperCase() || 'VERIFIED'}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Your Authenticated Recruiter Credential
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                        Your public Skill Passport validates your completed courses, verified skills, and academic profile. Share your authenticated portfolio directly with recruiters, hiring teams, and on your resume.
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {(user?.skills && user.skills.length > 0
                          ? user.skills
                          : ['Cybersecurity', 'React', 'Node.js', 'System Architecture']
                        ).map((skillName, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {skillName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 shrink-0 z-10 w-full sm:w-auto">
                      <button
                        onClick={() => navigate(`/passport/${passportSlug}`)}
                        className="px-5 py-3 bg-[#FA5A36] hover:bg-[#E04322] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FA5A36]/25 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
                        <span>View Public Passport</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={handleCopyPassportLink}
                        className="px-5 py-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copiedPassport ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-400" />
                            <span>Copy Passport Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 6: CERTIFICATES VIEW
                 ======================================================== */}
              {activeTab === 'certificates' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-black text-slate-900">Earned Certificates</h2>
                    <p className="text-xs text-slate-500">View and verify authentic credentials issued for completed courses.</p>
                  </div>

                  {dashboardData.recentCertificates && dashboardData.recentCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dashboardData.recentCertificates.map((cert) => (
                        <div
                          key={cert.certificateId}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                              <Award className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-extrabold text-slate-900 text-xs truncate">
                                {cert.courseTitle || 'Completion Certificate'}
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                Issued on {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Recently'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {cert.certificateAssetUrl && (
                              <button
                                onClick={() => window.open(cert.certificateAssetUrl as string, '_blank')}
                                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                              >
                                View
                              </button>
                            )}
                            <button
                              onClick={() => navigate(cert.verificationUrl || `/verify/${cert.certificateNumber}`)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl transition"
                            >
                              Verify
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <Award className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">No certificates earned yet</h3>
                      <p className="text-xs text-slate-400">Finish all course topics and pass the module assessment to earn your certificate.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 7: WISHLIST VIEW
                 ======================================================== */}
              {activeTab === 'wishlist' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-black text-slate-900">Saved Wishlist</h2>
                    <p className="text-xs text-slate-500">Courses and topics you bookmarked for future learning.</p>
                  </div>

                  {dashboardData.wishlist && dashboardData.wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboardData.wishlist.map((item) => (
                        <div
                          key={item.wishlistId || item.productId}
                          className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3"
                        >
                          <div className="aspect-video rounded-xl bg-slate-200 overflow-hidden">
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#FFF5F2] flex items-center justify-center text-[#FA5A36] font-bold text-xs">
                                Course
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 truncate">
                            <h3 className="font-extrabold text-slate-900 text-xs truncate">{item.title}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">₹{(item.price || 0).toLocaleString('en-IN')}</span>
                              <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>4.8</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                            <button
                              onClick={(e) => handleToggleWishlist(e, item.productId)}
                              className="p-1.5 text-red-500 hover:text-red-700 transition cursor-pointer"
                              title="Remove from Wishlist"
                            >
                              <Heart className="w-4 h-4 fill-red-500" />
                            </button>
                            <button
                              onClick={(e) => handleAddToCart(e, item.productId)}
                              disabled={addingCourseId === item.productId}
                              className="flex-1 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">Your wishlist is empty</h3>
                      <p className="text-xs text-slate-400">Save courses to track your upcoming learning goals.</p>
                      <button
                        onClick={() => navigate('/courses')}
                        className="px-4 py-2 bg-[#FA5A36] text-white text-xs font-bold rounded-xl"
                      >
                        Explore Courses
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 8: ORDERS VIEW
                 ======================================================== */}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-black text-slate-900">Order History & Invoices</h2>
                    <p className="text-xs text-slate-500">Track all your course purchases, single topic credits, and receipts.</p>
                  </div>

                  {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Item Purchased</th>
                            <th className="pb-3 text-right">Amount</th>
                            <th className="pb-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dashboardData.recentOrders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 font-semibold text-slate-500">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                              </td>
                              <td className="py-3 font-bold text-slate-900">{order.itemTitle || 'Course Enrollment'}</td>
                              <td className="py-3 text-right font-black text-slate-900">
                                ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 text-right">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                                  Paid
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
                      <p className="text-xs text-slate-400">Your completed purchases and receipts will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 9: OVERHAULED COURSE Q&A & DOUBTS STUDIO (IMAGE 2)
                 ======================================================== */}
              {activeTab === 'messages' && (
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-6">
                  {/* Header & New Doubt Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-slate-900">Course Q&A & Doubts Messenger</h2>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full shrink-0">
                          Live Instructor Connect
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Ask questions about your enrolled modules and receive fast guidance from course instructors.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAskModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ask New Question</span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search your doubts and topics..."
                        value={qnaSearch}
                        onChange={(e) => setQnaSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#FA5A36]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar pb-0.5 max-w-full">
                      <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
                      <button
                        onClick={() => setQnaFilter('ALL')}
                        className={`shrink-0 whitespace-nowrap px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          qnaFilter === 'ALL' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        All ({questionsList.length})
                      </button>
                      <button
                        onClick={() => setQnaFilter('ANSWERED')}
                        className={`shrink-0 whitespace-nowrap px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          qnaFilter === 'ANSWERED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        Answered ({questionsList.filter((q) => q.status === 'ANSWERED').length})
                      </button>
                      <button
                        onClick={() => setQnaFilter('PENDING')}
                        className={`shrink-0 whitespace-nowrap px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          qnaFilter === 'PENDING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        Pending ({questionsList.filter((q) => q.status === 'PENDING').length})
                      </button>
                    </div>
                  </div>

                  {/* Ask Question Inline/Modal Form */}
                  {isAskModalOpen && (
                    <div className="p-5 bg-[#FFF5F2] rounded-2xl border border-[#FFCCC2] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#FA5A36]" />
                          <span>Post a New Question to Instructor</span>
                        </h3>
                        <button onClick={() => setIsAskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handlePostQuestion} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Enrolled Course</label>
                            <select
                              value={selectedCourseForQuestion}
                              onChange={(e) => setSelectedCourseForQuestion(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#FA5A36]"
                            >
                              {dashboardData.activeCourses && dashboardData.activeCourses.length > 0 ? (
                                dashboardData.activeCourses.map((c) => (
                                  <option key={c.courseId} value={c.courseId}>
                                    {c.title}
                                  </option>
                                ))
                              ) : (
                                <option value="general">General Course Discussion</option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Question Title / Subject</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Clarification on React useEffect dependency array..."
                              value={newQuestionTitle}
                              onChange={(e) => setNewQuestionTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#FA5A36]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Explanation / Code snippet</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Describe the doubt, expected behavior, and where you are facing the issue..."
                            value={newQuestionBody}
                            onChange={(e) => setNewQuestionBody(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#FA5A36]"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAskModalOpen(false)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Question</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Questions List */}
                  {filteredQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {filteredQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-[#FFCCC2] transition space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-[#FFF5F2] text-[#FA5A36] text-[10px] font-bold rounded">
                                  {q.courseTitle}
                                </span>
                                {q.topicTitle && (
                                  <span className="text-[10px] text-slate-400 font-semibold">• {q.topicTitle}</span>
                                )}
                              </div>
                              <h3 className="text-sm font-black text-slate-900">{q.questionTitle}</h3>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {q.status === 'ANSWERED' ? (
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Answered
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full">
                                  Awaiting Instructor
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(q.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60">
                            {q.questionBody}
                          </p>

                          {/* Answers Section */}
                          {q.answers && q.answers.length > 0 && (
                            <div className="space-y-2.5 pl-3 border-l-2 border-[#FA5A36]">
                              <span className="text-[11px] font-bold text-slate-500">Instructor Responses:</span>
                              {q.answers.map((ans, aIdx) => (
                                <div key={aIdx} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-md bg-[#FA5A36] text-white font-bold text-[10px] flex items-center justify-center">
                                        {ans.instructorName[0]}
                                      </div>
                                      <span className="text-xs font-black text-slate-900">{ans.instructorName}</span>
                                      <span className="px-1.5 py-0.2 bg-[#FFF5F2] text-[#FA5A36] text-[9px] font-bold rounded">
                                        Instructor
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(ans.answeredAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed">{ans.answerText}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick Follow-up Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Write a follow-up reply..."
                              value={replyInputMap[q.id] || ''}
                              onChange={(e) => setReplyInputMap({ ...replyInputMap, [q.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddReply(q.id);
                                }
                              }}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#FA5A36]"
                            />
                            <button
                              onClick={() => handleAddReply(q.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-[#FFF5F2] hover:text-[#FA5A36] text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-2">
                      <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
                      <p className="text-xs text-slate-400">Post a question to start interacting with your instructors.</p>
                      <button
                        onClick={() => setIsAskModalOpen(true)}
                        className="px-4 py-2 bg-[#FA5A36] text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Ask Question Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 10: CONSOLIDATED PROFILE & SETTINGS (IMAGE 3)
                 ======================================================== */}
              {activeTab === 'settings' && (
                <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-xs space-y-6">
                  {/* Consolidated Header & Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Profile & Account Settings</h2>
                      <p className="text-xs text-slate-500">
                        Manage your verified credentials, academic qualifications, and learning preferences.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold overflow-x-auto no-scrollbar max-w-full">
                      <button
                        onClick={() => setProfileSubTab('profile')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'profile' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Personal Details
                      </button>
                      <button
                        onClick={() => setProfileSubTab('academic')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'academic' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Academic & Skills
                      </button>
                      <button
                        onClick={() => setProfileSubTab('preferences')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'preferences' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Preferences
                      </button>
                      <button
                        onClick={() => setProfileSubTab('security')}
                        className={`shrink-0 whitespace-nowrap py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'security' ? 'bg-[#FA5A36] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Security
                      </button>
                    </div>
                  </div>

                  {profileSaveSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Profile and account settings updated successfully!</span>
                    </div>
                  )}

                  {/* Profile Sub-Tab 1: Personal Details */}
                  {profileSubTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-6">
                      {/* 1. Interactive Avatar & Header Card */}
                      <div className="p-5 bg-gradient-to-r from-slate-50 to-orange-50/30 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Avatar Circle with Camera Overlay */}
                          <div className="relative group w-20 h-20 shrink-0">
                            {profileFormData.profilePhoto || profilePhoto ? (
                              <img
                                src={normalizeImageUrl(profileFormData.profilePhoto || profilePhoto) || ''}
                                alt={studentName}
                                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-[#FA5A36] text-white font-black text-2xl flex items-center justify-center shadow-md">
                                {studentName[0] || 'S'}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="absolute -bottom-1.5 -right-1.5 p-2 bg-slate-900 hover:bg-[#FA5A36] text-white rounded-xl shadow-md transition-colors cursor-pointer"
                              title="Upload New Photo"
                            >
                              <Camera className="w-4 h-4" />
                            </button>

                            <input
                              type="file"
                              ref={avatarInputRef}
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </div>

                          {/* Profile Details & Photo Actions */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-base">{studentName}</h3>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Student
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{studentEmail}</p>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <Upload className="w-3 h-3 text-[#FA5A36]" />
                                <span>Upload Photo</span>
                              </button>

                              {profileFormData.profilePhoto && (
                                <button
                                  type="button"
                                  onClick={() => setProfileFormData((prev) => ({ ...prev, profilePhoto: '' }))}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Profile Completion Gauge */}
                        <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs min-w-[200px] text-right space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500">Profile Completion</span>
                            <span className="text-sm font-black text-emerald-600">{completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 text-left">
                            {completionPercentage >= 80
                              ? 'Profile fully verified for certificates & passport'
                              : 'Add headline, location & social links to reach 100%'}
                          </p>
                        </div>
                      </div>

                      {/* 2. Personal & Professional Identity Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <UserIcon className="w-4 h-4 text-[#FA5A36]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Personal & Professional Identity
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={profileFormData.firstName}
                              onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                              placeholder="e.g. Maso"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 outline-none transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={profileFormData.lastName}
                              onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                              placeholder="e.g. Sharma"
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 outline-none transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Professional Headline / Student Tagline
                          </label>
                          <div className="relative">
                            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={profileFormData.headline}
                              onChange={(e) => setProfileFormData({ ...profileFormData, headline: e.target.value })}
                              placeholder="e.g. Computer Science Undergraduate | Aspiring Full-Stack & Cloud Developer"
                              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 outline-none transition"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">This appears on your public Verified Skill Passport and recruiter portfolio.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            About Me / Bio
                          </label>
                          <textarea
                            rows={3}
                            value={profileFormData.bio}
                            onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                            placeholder="Tell instructors, mentors, and peers about your background, career goals, and what technologies you are passionate about..."
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 outline-none transition"
                          />
                        </div>
                      </div>

                      {/* 3. Account Credentials & Contact Section */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Lock className="w-4 h-4 text-[#FA5A36]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Account & Contact Information
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Email Address - Protected / Read-only */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-bold text-slate-700">Account Email Address</label>
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Verified
                              </span>
                            </div>
                            <div className="relative">
                              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="email"
                                disabled
                                value={studentEmail}
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed outline-none"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Primary authentication login. Cannot be modified directly.</p>
                          </div>

                          {/* Phone Number */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              placeholder="+91 9876543210"
                              value={profileFormData.phone}
                              onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 outline-none transition"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Used for webinar and workshop reminders.</p>
                          </div>
                        </div>

                        {/* Location Fields: Country, State, City */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                            <div className="relative">
                              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="e.g. India"
                                value={profileFormData.country}
                                onChange={(e) => setProfileFormData({ ...profileFormData, country: e.target.value })}
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                            <div className="relative">
                              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="e.g. Maharashtra / California"
                                value={profileFormData.state}
                                onChange={(e) => setProfileFormData({ ...profileFormData, state: e.target.value })}
                                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none transition"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                            <input
                              type="text"
                              placeholder="e.g. Mumbai / San Francisco"
                              value={profileFormData.city}
                              onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Professional Portfolio & Social Links */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Globe className="w-4 h-4 text-[#FA5A36]" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Social Profiles & Portfolio Links
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile</label>
                            <input
                              type="url"
                              placeholder="https://linkedin.com/in/username"
                              value={profileFormData.linkedinUrl}
                              onChange={(e) => setProfileFormData({ ...profileFormData, linkedinUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile</label>
                            <input
                              type="url"
                              placeholder="https://github.com/username"
                              value={profileFormData.githubUrl}
                              onChange={(e) => setProfileFormData({ ...profileFormData, githubUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Personal Portfolio / Website</label>
                            <input
                              type="url"
                              placeholder="https://yourportfolio.dev"
                              value={profileFormData.websiteUrl}
                              onChange={(e) => setProfileFormData({ ...profileFormData, websiteUrl: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-7 py-3 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {profileSaving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Saving Changes...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Profile Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Profile Sub-Tab 2: Academic & Skills */}
                  {profileSubTab === 'academic' && (
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">College / University</label>
                          <div className="relative">
                            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="e.g. Stanford University / IIT Delhi"
                              value={profileFormData.institution}
                              onChange={(e) => setProfileFormData({ ...profileFormData, institution: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Qualification</label>
                          <div className="relative">
                            <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="e.g. B.Tech Computer Science"
                              value={profileFormData.qualification}
                              onChange={(e) => setProfileFormData({ ...profileFormData, qualification: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year</label>
                          <input
                            type="number"
                            placeholder="e.g. 2026"
                            value={profileFormData.graduationYear}
                            onChange={(e) => setProfileFormData({ ...profileFormData, graduationYear: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#FA5A36] outline-none"
                          />
                        </div>
                      </div>

                      {/* Verified Skills Editor */}
                      <div className="space-y-2 pt-2">
                        <label className="block text-xs font-bold text-slate-700">Verified Skills & Competencies</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[50px]">
                          {profileFormData.skills.map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#FA5A36] flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setProfileFormData({
                                    ...profileFormData,
                                    skills: profileFormData.skills.filter((_, idx) => idx !== sIdx),
                                  })
                                }
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}

                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="+ Add skill..."
                              value={profileFormData.newSkillInput}
                              onChange={(e) => setProfileFormData({ ...profileFormData, newSkillInput: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && profileFormData.newSkillInput.trim()) {
                                  e.preventDefault();
                                  setProfileFormData({
                                    ...profileFormData,
                                    skills: [...profileFormData.skills, profileFormData.newSkillInput.trim()],
                                    newSkillInput: '',
                                  });
                                }
                              }}
                              className="px-2 py-0.5 text-xs bg-transparent outline-none w-24 text-slate-700 placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">Press Enter after typing to add a new skill chip.</p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-6 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{profileSaving ? 'Saving Changes...' : 'Save Academic Details'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Profile Sub-Tab 3: Preferences */}
                  {profileSubTab === 'preferences' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-[#FA5A36]" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">Preferred Learning Language</h4>
                            <p className="text-[11px] text-slate-500">Audio and subtitle language defaults.</p>
                          </div>
                        </div>
                        <select
                          value={profileFormData.preferredLanguage}
                          onChange={(e) => setProfileFormData({ ...profileFormData, preferredLanguage: e.target.value })}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                        >
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Spanish">Spanish</option>
                        </select>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BellRing className="w-5 h-5 text-[#FA5A36]" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">Live Webinar Reminders</h4>
                            <p className="text-[11px] text-slate-500">Receive calendar alerts 15 minutes before scheduled classes.</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileFormData.webinarReminders}
                          onChange={(e) => setProfileFormData({ ...profileFormData, webinarReminders: e.target.checked })}
                          className="w-4 h-4 text-[#FA5A36] rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Profile Sub-Tab 4: Security */}
                  {profileSubTab === 'security' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                          <Lock className="w-4 h-4 text-[#FA5A36]" />
                          <span>Account Security & Session</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Your account is securely authenticated. To change your password or update credentials, request a password reset link.
                        </p>
                        <button
                          type="button"
                          onClick={() => alert('Password reset verification link sent to ' + studentEmail)}
                          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          Send Password Reset Email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* Slide-Over Drawers (Notifications & Messages) */}
      {activeDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveDrawer(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center">
                    {activeDrawer === 'messages' ? <Mail className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {activeDrawer === 'messages' ? 'Course Q&A & Messages' : 'Notifications'}
                    </h3>
                    <p className="text-[10px] text-slate-500">Real-time alerts and replies</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {dashboardData?.notifications &&
                (Array.isArray(dashboardData.notifications)
                  ? dashboardData.notifications.length > 0
                  : ((dashboardData.notifications as any).recent?.length || 0) > 0) ? (
                  (Array.isArray(dashboardData.notifications)
                    ? dashboardData.notifications
                    : (dashboardData.notifications as any).recent
                  ).map((n: any, idx: number) => (
                    <div key={n.notificationId || idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 space-y-2 text-slate-400">
                    <Bell className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">All caught up!</p>
                    <p className="text-[11px]">No unread alerts at this time.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Synced with LMS realtime server</span>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="px-4 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Player Modal for Student */}
      {activeQuizId && (
        <QuizPlayerModal
          quizId={activeQuizId}
          isOpen={true}
          onClose={() => {
            setActiveQuizId(null);
            fetchDashboardData();
          }}
        />
      )}
      {/* Mobile Bottom Navigation Dock (<= 500px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 flex items-center justify-around px-2 min-[501px]:hidden shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
            activeTab === 'dashboard' ? 'text-[#FA5A36]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my-learning')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
            activeTab === 'my-learning' ? 'text-[#FA5A36]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>My Learning</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('live-classes')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
            activeTab === 'live-classes' ? 'text-[#FA5A36]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Video className="w-5 h-5" />
          <span>Live Classes</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('settings');
            setProfileSubTab('profile');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold cursor-pointer transition ${
            activeTab === 'settings' && profileSubTab === 'profile' ? 'text-[#FA5A36]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>

      <Footer />
      {/* Student Workshop Notes Modal */}
      {selectedWebinarForNotes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-50 text-[#FA5A36]">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    {selectedWebinarForNotes.title}
                  </h3>
                </div>
                {selectedWebinarForNotes.instructorName && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Instructor: {selectedWebinarForNotes.instructorName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedWebinarForNotes(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Your Personal Workshop Notes (Private to You)
              </label>
              {isLoadingWebinarNotes ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#FA5A36]" />
                  Loading your notes...
                </div>
              ) : (
                <textarea
                  rows={8}
                  value={webinarNotesText}
                  onChange={(e) => setWebinarNotesText(e.target.value)}
                  placeholder="Record key commands, code snippets, takeaways, and questions here..."
                  className="w-full p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#FA5A36] focus:bg-white transition resize-none leading-relaxed"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(webinarNotesText || '');
                  setCopiedWebinarNotes(true);
                  setTimeout(() => setCopiedWebinarNotes(false), 2000);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
              >
                {copiedWebinarNotes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Notes</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWebinarForNotes(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentWebinarNotes}
                  disabled={isSavingWebinarNotes}
                  className="px-4 py-2 bg-[#FA5A36] hover:bg-[#e04825] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingWebinarNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
