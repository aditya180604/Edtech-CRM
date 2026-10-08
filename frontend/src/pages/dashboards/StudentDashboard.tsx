import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getStudentDashboard, toggleWishlist } from '../../api/studentDashboard';
import { authApi } from '../../api/auth';
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
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { quizzesApi, type QuizItem } from '../../api/quizzes';
import { QuizPlayerModal } from '../../components/quiz/QuizPlayerModal';

type StudentTab =
  | 'dashboard'
  | 'my-learning'
  | 'live-classes'
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

  // Course Q&A State
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedCourseForQuestion, setSelectedCourseForQuestion] = useState('');
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionBody, setNewQuestionBody] = useState('');
  const [qnaFilter, setQnaFilter] = useState<'ALL' | 'ANSWERED' | 'PENDING'>('ALL');
  const [qnaSearch, setQnaSearch] = useState('');
  const [questionsList, setQuestionsList] = useState<QnAQuestion[]>([]);
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});

  // Profile Form Edit State
  const [profileFormData, setProfileFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    timezone: '',
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
      setDashboardData(data);

      if (data?.profile) {
        setProfileFormData({
          firstName: data.profile.firstName || user?.firstName || '',
          lastName: data.profile.lastName || user?.lastName || '',
          phone: data.profile.phone || user?.phone || '',
          country: data.profile.country || (user as any)?.country || '',
          timezone: data.profile.timezone || (user as any)?.timezone || 'Asia/Kolkata',
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

      // Initialize default QnA questions from enrolled courses
      if (data?.activeCourses && data.activeCourses.length > 0) {
        const primary = data.activeCourses[0];
        const initialQ: QnAQuestion[] = [
          {
            id: 'qna-1',
            courseTitle: primary.title,
            courseId: primary.courseId,
            topicTitle: primary.lastAccessedLesson?.title || 'Core Fundamentals',
            questionTitle: 'How is JWT refresh token grace period handled during concurrent requests?',
            questionBody: 'When multiple parallel requests fail with 401 at the exact same moment, how does the backend avoid invalidating the token reuse detector?',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            status: 'ANSWERED',
            answers: [
              {
                instructorName: primary.instructorName || 'Lead Instructor',
                answerText:
                  'We store a 30-second previousRefreshTokenHash grace window in MongoDB. When simultaneous requests hit the refresh endpoint, they are accepted within that window without triggering a revoked-token false alarm!',
                answeredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
              },
            ],
          },
          {
            id: 'qna-2',
            courseTitle: primary.title,
            courseId: primary.courseId,
            topicTitle: 'Course Architecture',
            questionTitle: 'Can I download certificates in signed PDF format after completing all modules?',
            questionBody: 'Will the certificate carry the unique certificateNumber verifiable by employers on the public /verify page?',
            createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
            status: 'ANSWERED',
            answers: [
              {
                instructorName: 'Academic Team',
                answerText:
                  'Yes! Every certificate generated generates a tamper-proof verification number and signed PDF that matches your public Verified Skill Passport.',
                answeredAt: new Date(Date.now() - 3600000 * 36).toISOString(),
              },
            ],
          },
        ];
        setQuestionsList(initialQ);
      }

      if (data?.activeCourses && Array.isArray(data.activeCourses)) {
        try {
          const enrolledList = data.activeCourses.map((c: any) => ({
            id: c.id || c._id,
            slug: c.slug,
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
  }, []);

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
  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTitle.trim() || !newQuestionBody.trim()) return;

    const courseObj = dashboardData?.activeCourses?.find(
      (c) => c.courseId === selectedCourseForQuestion || c.title === selectedCourseForQuestion
    ) || dashboardData?.activeCourses?.[0];

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
        country: profileFormData.country,
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
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update profile:', err);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
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
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
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
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
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
                <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-indigo-950 truncate">Upgrade Available</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Credit applied: <strong className="text-indigo-600 font-bold">₹{primaryUpgrade.accumulatedCredit || 0} off</strong>
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
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Upgrade Now →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition mx-auto cursor-pointer"
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
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
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
                        isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
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
        <main className="flex-1 flex flex-col min-w-0 space-y-5">
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
                placeholder="Search for courses, topics, or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
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
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
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
                          await logout();
                          navigate('/login');
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
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
                    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border border-amber-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
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
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <span>Complete Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 1. EXPANDED WELCOME BOX WITH DYNAMIC TIME-AWARE GREETING */}
                  <div className="bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-blue-50/90 border border-indigo-100/80 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="space-y-2 z-10 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-indigo-100 text-indigo-700 text-xs font-bold mb-1 shadow-2xs">
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
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
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
                    <div className="hidden sm:flex flex-col items-center justify-center p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-indigo-100 shadow-sm min-w-[140px] text-center z-10">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Streak</span>
                      <div className="flex items-center justify-center gap-1 my-1">
                        <span className="text-xl font-black text-slate-900">{currentStreak}</span>
                        <span className="text-base">🔥</span>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-bold">Days Active</span>
                    </div>

                    {/* Subtle decorative glow */}
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* 2. REDESIGNED LEARNING OVERVIEW: 4 HORIZONTAL METRIC CARDS ROW */}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                      {/* Metric 1: Active Courses */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-sm transition flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-2xl font-black text-slate-900 block leading-tight">
                            {stats.activeCoursesCount}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Active Courses</span>
                        </div>
                      </div>

                      {/* Metric 2: Topics Owned */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-amber-200 hover:shadow-sm transition flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-2xl font-black text-slate-900 block leading-tight">
                            {stats.purchasedTopicsCount}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Topics Owned</span>
                        </div>
                      </div>

                      {/* Metric 3: Completed Courses */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-200 hover:shadow-sm transition flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-2xl font-black text-slate-900 block leading-tight">
                            {stats.completedCoursesCount}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Completed Courses</span>
                        </div>
                      </div>

                      {/* Metric 4: Certificates */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-200 hover:shadow-sm transition flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-2xl font-black text-slate-900 block leading-tight">
                            {stats.certificatesCount}
                          </span>
                          <span className="text-xs font-bold text-slate-500">Certificates Earned</span>
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
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 fill-indigo-600" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">Continue Learning</h3>
                        </div>
                        {dashboardData.activeCourses && dashboardData.activeCourses.length > 1 && (
                          <button
                            onClick={() => setActiveTab('my-learning')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
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
                                <BookOpen className="w-8 h-8 text-indigo-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                              <button
                                onClick={() => navigate(`/course/${primaryCourse.slug}`)}
                                className="w-10 h-10 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
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
                                <span className="text-indigo-600 font-black">{primaryCourse.entitledProgressPercentage || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${primaryCourse.entitledProgressPercentage || 0}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => navigate(`/course/${primaryCourse.slug}`)}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
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
                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
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
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
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
                              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-indigo-100 transition"
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
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
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
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">My Learning</h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('my-learning')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
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
                              className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 cursor-pointer transition"
                            >
                              <div className="flex items-center gap-3 truncate">
                                {course.thumbnail ? (
                                  <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-100"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
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
                                <span className="font-bold text-xs text-indigo-600">
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
                      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-indigo-800 shadow-md space-y-3">
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
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
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
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
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

                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold">
                      <button
                        onClick={() => setMyLearningTab('COURSES')}
                        className={`py-1.5 px-3 rounded-lg transition ${
                          myLearningTab === 'COURSES' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Enrolled ({stats.activeCoursesCount})
                      </button>
                      <button
                        onClick={() => setMyLearningTab('TOPICS')}
                        className={`py-1.5 px-3 rounded-lg transition ${
                          myLearningTab === 'TOPICS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Purchased Topics ({stats.purchasedTopicsCount})
                      </button>
                      <button
                        onClick={() => setMyLearningTab('COMPLETED')}
                        className={`py-1.5 px-3 rounded-lg transition ${
                          myLearningTab === 'COMPLETED' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                          className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex flex-col justify-between hover:border-indigo-200 transition group"
                        >
                          <div className="aspect-video bg-slate-900 relative overflow-hidden">
                            {course.thumbnail ? (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-indigo-400">
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
                                <span className="text-indigo-600">{course.entitledProgressPercentage || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${course.entitledProgressPercentage || 0}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => navigate(`/course/${course.slug}`)}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
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
                        className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Explore Courses
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  TAB 3: LIVE CLASSES VIEW
                 ======================================================== */}
              {activeTab === 'live-classes' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5">
                  <div className="pb-3 border-b border-slate-100">
                    <h2 className="text-base font-black text-slate-900">Live Classes & Workshops</h2>
                    <p className="text-xs text-slate-500">Join interactive live webinar sessions and get real-time instructor mentoring.</p>
                  </div>

                  {dashboardData.upcomingLiveSessions && dashboardData.upcomingLiveSessions.length > 0 ? (
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
                            <p className="text-xs font-bold text-indigo-600">Instructor: {session.instructorName || 'Lead Instructor'}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                            </div>
                            <button
                              onClick={() => {
                                if (session.meetingUrl) {
                                  window.open(session.meetingUrl, '_blank');
                                } else {
                                  navigate('/webinars');
                                }
                              }}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                            >
                              Join Class
                            </button>
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
                  )}
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
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
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
                              <span className="text-[10px] font-bold text-indigo-600 truncate">
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
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
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
                  <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/60 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl z-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Verified Skill Passport
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold">
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
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
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
                              <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
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
                              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
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
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
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
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
                  {/* Header & New Doubt Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-slate-900">Course Q&A & Doubts Messenger</h2>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Live Instructor Connect
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ask questions about your enrolled modules and receive fast guidance from course instructors.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAskModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
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
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                      <button
                        onClick={() => setQnaFilter('ALL')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          qnaFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        All ({questionsList.length})
                      </button>
                      <button
                        onClick={() => setQnaFilter('ANSWERED')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          qnaFilter === 'ANSWERED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        Answered ({questionsList.filter((q) => q.status === 'ANSWERED').length})
                      </button>
                      <button
                        onClick={() => setQnaFilter('PENDING')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          qnaFilter === 'PENDING' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                        }`}
                      >
                        Pending ({questionsList.filter((q) => q.status === 'PENDING').length})
                      </button>
                    </div>
                  </div>

                  {/* Ask Question Inline/Modal Form */}
                  {isAskModalOpen && (
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
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
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
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
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
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
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
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
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
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
                          className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 hover:border-indigo-200 transition space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
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
                            <div className="space-y-2.5 pl-3 border-l-2 border-indigo-500">
                              <span className="text-[11px] font-bold text-slate-500">Instructor Responses:</span>
                              {q.answers.map((ans, aIdx) => (
                                <div key={aIdx} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                                        {ans.instructorName[0]}
                                      </div>
                                      <span className="text-xs font-black text-slate-900">{ans.instructorName}</span>
                                      <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded">
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
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={() => handleAddReply(q.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
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
                        className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
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
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
                  {/* Consolidated Header & Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-slate-900">Profile & Account Settings</h2>
                      <p className="text-xs text-slate-500">
                        Manage your verified credentials, academic qualifications, and learning preferences.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-bold">
                      <button
                        onClick={() => setProfileSubTab('profile')}
                        className={`py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'profile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Personal Details
                      </button>
                      <button
                        onClick={() => setProfileSubTab('academic')}
                        className={`py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'academic' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Academic & Skills
                      </button>
                      <button
                        onClick={() => setProfileSubTab('preferences')}
                        className={`py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'preferences' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Preferences
                      </button>
                      <button
                        onClick={() => setProfileSubTab('security')}
                        className={`py-1.5 px-3 rounded-xl transition ${
                          profileSubTab === 'security' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {profilePhoto ? (
                            <img
                              src={normalizeImageUrl(profilePhoto) || ''}
                              alt={studentName}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center">
                              {studentName[0]}
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">{studentName}</h3>
                            <p className="text-xs text-slate-500">{studentEmail}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-500 block">Profile Completion</span>
                          <span className="text-base font-black text-emerald-600">{completionPercentage}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                          <input
                            type="text"
                            value={profileFormData.firstName}
                            onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={profileFormData.lastName}
                            onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                          <input
                            type="text"
                            placeholder="+91 9876543210"
                            value={profileFormData.phone}
                            onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                          <input
                            type="text"
                            placeholder="e.g. India"
                            value={profileFormData.country}
                            onChange={(e) => setProfileFormData({ ...profileFormData, country: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
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
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
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
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
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
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
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
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-1.5 shadow-2xs"
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
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                          <Globe className="w-5 h-5 text-indigo-600" />
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
                          <BellRing className="w-5 h-5 text-indigo-600" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">Live Webinar Reminders</h4>
                            <p className="text-[11px] text-slate-500">Receive calendar alerts 15 minutes before scheduled classes.</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={profileFormData.webinarReminders}
                          onChange={(e) => setProfileFormData({ ...profileFormData, webinarReminders: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Profile Sub-Tab 4: Security */}
                  {profileSubTab === 'security' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                          <Lock className="w-4 h-4 text-indigo-600" />
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
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
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

      <Footer />
    </div>
  );
};
