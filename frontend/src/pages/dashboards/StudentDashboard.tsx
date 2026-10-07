import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getStudentDashboard, toggleWishlist } from '../../api/studentDashboard';
import type { StudentDashboardData, ActiveEnrolledCourse } from '../../types/studentDashboard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { ProfileUpdateModal } from '../../components/dashboard/ProfileUpdateModal';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quizzesApi, type QuizItem } from '../../api/quizzes';
import { QuizPlayerModal } from '../../components/quiz/QuizPlayerModal';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'week' | 'all'>('month');
  const [myLearningTab, setMyLearningTab] = useState<'COURSES' | 'TOPICS' | 'COMPLETED'>('COURSES');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [wishlistState, setWishlistState] = useState<Record<string, boolean>>({});
  const [activeDrawer, setActiveDrawer] = useState<'notifications' | 'messages' | null>(null);
  const [copiedPassport, setCopiedPassport] = useState(false);
  const [studentQuizzes, setStudentQuizzes] = useState<QuizItem[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

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
      if (data?.activeCourses && Array.isArray(data.activeCourses)) {
        try {
          const enrolledList = data.activeCourses.map((c: any) => ({
            id: c.id || c._id,
            slug: c.slug,
          }));
          sessionStorage.setItem('edtech_student_enrolled_courses', JSON.stringify(enrolledList));
        } catch {
          // ignore storage errors
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
        const quizPromises = data.activeCourses.map((c) =>
          quizzesApi.getQuizzesByCourse(c.courseId || (c as any).id || (c as any)._id).catch(() => ({ data: [] }))
        );
        const quizResults = await Promise.all(quizPromises);
        const allQuizzes = quizResults.flatMap((r) => (r.data ? r.data : []));
        setStudentQuizzes(allQuizzes);
      }
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
      // Silently refresh dashboard data
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

  const studentName = dashboardData?.profile?.firstName
    ? `${dashboardData.profile.firstName} ${dashboardData.profile.lastName || ''}`.trim()
    : `${user?.firstName || 'Student'} ${user?.lastName || ''}`.trim();

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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top App Search & User Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 sm:px-6 rounded-2xl border border-slate-100 shadow-xs">
          <div className="relative w-full sm:w-96">
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

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setActiveDrawer('notifications')}
              className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {Array.isArray(dashboardData?.notifications)
                  ? dashboardData.notifications.length
                  : (dashboardData?.notifications as any)?.unreadCount || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveDrawer('messages')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Messages & Q&A"
            >
              <Mail className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* User Profile Chip - Navigates directly to Student Profile Verification page */}
            <div
              onClick={() => navigate('/student/complete-profile')}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 cursor-pointer transition group"
              title="View & Edit Student Profile"
            >
              {profilePhoto ? (
                <img
                  src={normalizeImageUrl(profilePhoto) || ''}
                  alt={studentName}
                  className="w-8 h-8 rounded-lg object-cover border border-white shrink-0 shadow-2xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {studentName[0]?.toUpperCase() || 'S'}
                </div>
              )}
              <div className="text-left leading-tight hidden sm:block">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{studentName}</p>
                <p className="text-[10px] font-semibold text-slate-500">Student</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-xs text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Dashboard Unavailable</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : dashboardData ? (
          <div className="space-y-6">
            <LiveStartedBanner />

            {/* Mandatory Student Verification Alert Banner */}
            {!user?.isProfileCompleted && (
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border border-amber-200/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        Action Required: Complete Your Student Profile
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                        All Fields Mandatory
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Verify your college, degree, phone, and skills to unlock genuine course certificates and generate your <strong className="text-indigo-600 font-bold">Verified Skill Passport</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/student/complete-profile')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
                >
                  <span>Complete Profile Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ========================================================
                ROW 1: HERO & GREETING | PROFILE SUMMARY | LEARNING OVERVIEW
               ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1.1 Hero Welcome & Streak Banner (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/90 via-purple-50/70 to-blue-50/90 border border-indigo-100/80 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="space-y-2 z-10 max-w-[70%]">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {greeting}, {dashboardData?.profile?.firstName || user?.firstName || 'Student'}! 👋
                  </h1>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {primaryCourse
                      ? `Keep learning, keep growing. You're ${Math.max(
                          1,
                          (primaryCourse.totalCourseTopicsCount || 0) - (primaryCourse.enrolledTopicsCount || 0)
                        )} topics away from completing ${primaryCourse.title}.`
                      : 'Keep learning, keep growing. Discover new industry-led topics and courses to accelerate your career.'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/courses')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Learning Streak Widget (Floating on top right) */}
                <div className="absolute right-4 top-4 sm:top-6 bg-white/95 backdrop-blur-xs rounded-2xl p-3 border border-indigo-100/80 shadow-md shadow-indigo-900/5 text-center min-w-[100px] z-10">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Learning Streak</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-base font-black text-slate-900">{currentStreak} days</span>
                    <span className="text-sm">🔥</span>
                  </div>
                  {/* Visualizer bars */}
                  <div className="flex items-end justify-center gap-1 h-5 mt-1.5 px-1">
                    {[35, 60, 45, 80, 100].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full ${
                          i === 4 ? 'bg-indigo-600' : 'bg-indigo-200'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Decorative background glow */}
                <div className="absolute -bottom-4 right-1 opacity-25 lg:opacity-40 pointer-events-none">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 blur-2xl" />
                </div>
              </div>

              {/* 1.2 Profile Completion Card (3.5 cols) */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                  {profilePhoto ? (
                    <img
                      src={normalizeImageUrl(profilePhoto) || ''}
                      alt={studentName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center shrink-0">
                      {studentName[0]?.toUpperCase() || 'S'}
                    </div>
                  )}
                  <div className="truncate">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">{studentName}</h3>
                    <p className="text-xs text-slate-400 truncate">{studentEmail}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Profile completion</span>
                    <span className="text-slate-900 font-extrabold">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => navigate('/student/complete-profile')}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Update Profile Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate(`/passport/${passportSlug}`)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Verified Skill Passport</span>
                  </button>
                </div>
              </div>

              {/* 1.3 Learning Overview (3.5 cols) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Learning Overview</h3>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                    className="text-[11px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50/50 rounded-2xl flex items-center gap-3 border border-indigo-100/50">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block leading-tight">
                        {stats.activeCoursesCount}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Active Courses</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-2xl flex items-center gap-3 border border-amber-100/50">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block leading-tight">
                        {stats.purchasedTopicsCount}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Purchased Topics</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-2xl flex items-center gap-3 border border-emerald-100/50">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block leading-tight">
                        {stats.completedCoursesCount}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Completed</span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50/50 rounded-2xl flex items-center gap-3 border border-purple-100/50">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-900 block leading-tight">
                        {stats.certificatesCount}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">Certificates</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                VERIFIED SKILL PASSPORT SHOWCASE CARD
               ======================================================== */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white border border-indigo-900/60 shadow-lg relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-3 max-w-2xl z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Skill Passport
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-mono font-bold">
                    ID: STU-{user?._id?.toString().slice(-6).toUpperCase() || 'VERIFIED'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <Award className="w-6 h-6 text-indigo-400 shrink-0" />
                  Your Authenticated Recruiter Credential
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Your public Skill Passport validates your completed courses, verified skills, and academic profile. Share your authenticated portfolio directly with recruiters, hiring teams, and on your resume.
                </p>

                {/* Verified Skill Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(user?.skills && user.skills.length > 0
                    ? user.skills
                    : ['Cybersecurity', 'React', 'Node.js', 'System Architecture']
                  ).slice(0, 5).map((skillName, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {skillName}
                    </span>
                  ))}
                  <span className="text-[11px] text-indigo-300 font-bold self-center">
                    + Authenticated
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 z-10 w-full sm:w-auto">
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

            {/* ========================================================
                ROW 2: CONTINUE LEARNING | UPGRADE OPPORTUNITIES | UPCOMING LIVE CLASSES
               ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 2.1 Continue Learning */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Continue Learning</h3>
                  {dashboardData.activeCourses && dashboardData.activeCourses.length > 1 && (
                    <button
                      onClick={() => navigate('/courses')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {primaryCourse ? (
                  <div className="space-y-4">
                    {/* Featured Video Thumbnail */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-100 shadow-inner group">
                      {primaryCourse.thumbnail ? (
                        <img
                          src={primaryCourse.thumbnail}
                          alt={primaryCourse.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-indigo-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <button
                          onClick={() => navigate(`/course/${primaryCourse.slug}`)}
                          className="w-12 h-12 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </button>
                      </div>
                      {primaryCourse.lastAccessedLesson?.duration ? (
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold rounded-md">
                          {primaryCourse.lastAccessedLesson.duration}
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">{primaryCourse.title}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {primaryCourse.lastAccessedLesson?.title
                          ? `Current Topic: ${primaryCourse.lastAccessedLesson.title}`
                          : `Enrolled: ${primaryCourse.enrolledTopicsCount || 0} of ${primaryCourse.totalCourseTopicsCount || 0} topics`}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-indigo-600 font-extrabold">{primaryCourse.entitledProgressPercentage || 0}%</span>
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
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Continue Learning
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">No active enrolled courses in progress.</p>
                    <button
                      onClick={() => navigate('/courses')}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                    >
                      Explore Courses
                    </button>
                  </div>
                )}
              </div>

              {/* 2.2 Upgrade Opportunities */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Upgrade Opportunities</h3>
                  {dashboardData.upgradeOpportunities && dashboardData.upgradeOpportunities.length > 2 && (
                    <button
                      onClick={() => navigate('/courses')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {dashboardData.upgradeOpportunities && dashboardData.upgradeOpportunities.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.upgradeOpportunities.slice(0, 2).map((upgrade) => (
                      <div
                        key={upgrade.courseId}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 hover:border-indigo-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{upgrade.courseTitle}</h4>
                            <p className="text-[10px] text-slate-400">Full Course ({upgrade.eligibleTopicCount} topics owned)</p>
                          </div>
                        </div>

                        <div className="text-[11px] space-y-1 pt-1 border-t border-slate-200/60 text-slate-600">
                          <div className="flex justify-between">
                            <span>Course Price</span>
                            <span className="font-semibold text-slate-900">₹{(upgrade.fullCoursePrice || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Your Credit ({upgrade.eligibleTopicCount} topics)</span>
                            <span className="font-semibold text-red-500">-₹{(upgrade.accumulatedCredit || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200/60">
                            <span className="text-slate-900">Pay Only</span>
                            <span className="text-emerald-600">₹{(upgrade.upgradePrice || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              await addToCart(upgrade.courseId, 'COURSE');
                              navigate('/cart');
                            } catch {
                              navigate(`/course/${upgrade.courseSlug}`);
                            }
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Upgrade to Full Course</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">All Set!</p>
                    <p className="text-[11px] text-slate-400">You have full ownership of all your enrolled courses.</p>
                  </div>
                )}
              </div>

              {/* 2.3 Upcoming Live Classes */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Upcoming Live Classes</h3>
                  {dashboardData.upcomingLiveSessions && dashboardData.upcomingLiveSessions.length > 2 && (
                    <button
                      onClick={() => navigate('/webinars')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {dashboardData.upcomingLiveSessions && dashboardData.upcomingLiveSessions.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.upcomingLiveSessions.slice(0, 2).map((session, idx) => (
                      <div
                        key={session.sessionId || idx}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3 hover:border-indigo-100 transition"
                      >
                        <div className="space-y-1 truncate">
                          <div className="flex items-center gap-1.5">
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded-md uppercase tracking-wider">
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
                          {idx === 0 ? 'Join Class' : 'View Details'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <Video className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">No live classes scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================
                ROW 3: MY LEARNING | RECENT CERTIFICATES | WISHLIST
               ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 3.1 My Learning List with Tabs */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">My Learning</h3>
                  {dashboardData.activeCourses && dashboardData.activeCourses.length > 3 && (
                    <button
                      onClick={() => navigate('/courses')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Tab Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold">
                  <button
                    onClick={() => setMyLearningTab('COURSES')}
                    className={`flex-1 py-1 px-2 rounded-lg transition ${
                      myLearningTab === 'COURSES' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    My Courses ({stats.activeCoursesCount})
                  </button>
                  <button
                    onClick={() => setMyLearningTab('TOPICS')}
                    className={`flex-1 py-1 px-2 rounded-lg transition ${
                      myLearningTab === 'TOPICS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Purchased Topics ({stats.purchasedTopicsCount})
                  </button>
                  <button
                    onClick={() => setMyLearningTab('COMPLETED')}
                    className={`flex-1 py-1 px-2 rounded-lg transition ${
                      myLearningTab === 'COMPLETED' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Completed ({stats.completedCoursesCount})
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {dashboardData.activeCourses && dashboardData.activeCourses.length > 0 ? (
                    dashboardData.activeCourses.slice(0, 3).map((course) => (
                      <div
                        key={course.courseId}
                        onClick={() => navigate(`/course/${course.slug}`)}
                        className="p-3 bg-slate-50/70 hover:bg-indigo-50/40 rounded-2xl border border-slate-100/80 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 truncate">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="truncate">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{course.title}</h4>
                            <p className="text-[10px] text-slate-400">
                              {course.totalCourseTopicsCount || 0} topics • {course.enrolledTopicsCount || 0} purchased
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-16 hidden sm:block">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${course.entitledProgressPercentage || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-black text-xs text-slate-700 w-8 text-right">
                            {course.entitledProgressPercentage || 0}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400">No learning items in this category yet.</div>
                  )}
                </div>
              </div>

              {/* 3.2 Recently Earned Certificates */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Recently Earned Certificates</h3>
                  {dashboardData.recentCertificates && dashboardData.recentCertificates.length > 2 && (
                    <button
                      onClick={() => navigate('/certificates')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {dashboardData.recentCertificates && dashboardData.recentCertificates.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentCertificates.slice(0, 2).map((cert) => (
                      <div
                        key={cert.certificateId}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">
                              {cert.courseTitle || 'Completion Certificate'}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              Issued on {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              if (cert.certificateAssetUrl) window.open(cert.certificateAssetUrl, '_blank');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition"
                          >
                            View
                          </button>
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
                  <div className="text-center py-8 space-y-2">
                    <Award className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Certificates Await</p>
                    <p className="text-[11px] text-slate-400">Complete all lessons and quizzes to earn verifiable certificates.</p>
                  </div>
                )}
              </div>

              {/* 3.3 Your Wishlist */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Your Wishlist</h3>
                  {dashboardData.wishlist && dashboardData.wishlist.length > 2 && (
                    <button
                      onClick={() => navigate('/wishlist')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {dashboardData.wishlist && dashboardData.wishlist.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.wishlist.slice(0, 2).map((item) => (
                      <div
                        key={item.wishlistId || item.productId}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-indigo-100 transition"
                      >
                        <div className="flex items-center gap-3 truncate">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div className="truncate">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-slate-900">₹{(item.price || 0).toLocaleString('en-IN')}</span>
                              <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>4.8</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">Your wishlist is empty.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================
                ROW 3.5: ASSESSMENTS & KNOWLEDGE CHECKS
               ======================================================== */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Course Quizzes & Assessments</h3>
                    <p className="text-[11px] text-slate-500">
                      Take interactive checkpoints for your enrolled courses to test understanding and extend streaks.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                  {studentQuizzes.length} Available
                </span>
              </div>

              {studentQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {studentQuizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
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
                        <h4 className="text-xs font-black text-slate-900 line-clamp-1">{quiz.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {quiz.description || 'Module mastery assessment with instant grading.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">
                          {quiz.duration || 15}m • Pass: {quiz.passingScore || 70}%
                        </span>
                        <button
                          onClick={() => setActiveQuizId(quiz._id)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shadow-xs"
                        >
                          {quiz.hasPassed ? 'Retake Quiz' : 'Start Quiz'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active quizzes for your enrolled courses yet. Once instructors publish quizzes, they will automatically appear here.
                </div>
              )}
            </div>

            {/* ========================================================
                ROW 4: RECENT ORDERS | RECENT NOTIFICATIONS | RECOMMENDED
               ======================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 4.1 Recent Orders */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Recent Orders</h3>
                  {dashboardData.recentOrders && dashboardData.recentOrders.length > 3 && (
                    <button
                      onClick={() => navigate('/orders')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 px-1">
                      <span className="col-span-3">Date</span>
                      <span className="col-span-5">Item</span>
                      <span className="col-span-2 text-right">Amount</span>
                      <span className="col-span-2 text-right">Status</span>
                    </div>

                    {dashboardData.recentOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.orderId}
                        className="grid grid-cols-12 items-center text-xs p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl transition gap-1"
                      >
                        <span className="col-span-3 text-[11px] font-semibold text-slate-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                        </span>
                        <span className="col-span-5 font-bold text-slate-900 truncate" title={order.itemTitle || 'Course Order'}>
                          {order.itemTitle || 'Course Order'}
                        </span>
                        <span className="col-span-2 text-right font-black text-slate-900">
                          ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="col-span-2 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                            Paid
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">No recent orders yet.</div>
                )}
              </div>

              {/* 4.2 Recent Notifications */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Recent Notifications</h3>
                  {dashboardData.notifications &&
                    (Array.isArray(dashboardData.notifications)
                      ? dashboardData.notifications.length > 4
                      : ((dashboardData.notifications as any).recent?.length || 0) > 4) && (
                      <button
                        onClick={() => navigate('/notifications')}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        View All <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                </div>

                <div className="space-y-3">
                  {dashboardData.notifications &&
                  (Array.isArray(dashboardData.notifications)
                    ? dashboardData.notifications.length > 0
                    : (dashboardData.notifications as any).recent?.length > 0) ? (
                    (Array.isArray(dashboardData.notifications)
                      ? dashboardData.notifications
                      : (dashboardData.notifications as any).recent
                    )
                      .slice(0, 4)
                      .map((n: any, idx: number) => (
                        <div key={n.notificationId || idx} className="flex items-start gap-3 text-xs">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="truncate flex-1">
                            <p className="font-bold text-slate-900 truncate">{n.title || n.message}</p>
                            <p className="text-[10px] text-slate-400">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                            </p>
                          </div>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2" />}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 space-y-1">
                      <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4.3 Recommended For You */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Recommended For You</h3>
                  {dashboardData.recommendations && dashboardData.recommendations.length > 2 && (
                    <button
                      onClick={() => navigate('/courses')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {dashboardData.recommendations && dashboardData.recommendations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {dashboardData.recommendations.slice(0, 2).map((rec) => {
                      const isWishlisted = Boolean(wishlistState[rec.courseId]);
                      return (
                        <div
                          key={rec.courseId}
                          onClick={() => navigate(`/course/${rec.slug}`)}
                          className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2 hover:border-indigo-100 transition cursor-pointer"
                        >
                          <div className="aspect-video rounded-xl bg-slate-200 overflow-hidden">
                            {rec.thumbnail ? (
                              <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                Course
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5 truncate">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate" title={rec.title}>
                              {rec.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">₹{(rec.price || 0).toLocaleString('en-IN')}</span>
                              <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{rec.rating || 4.8}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleToggleWishlist(e, rec.courseId)}
                            className={`w-full py-1 text-[11px] font-bold rounded-lg border flex items-center justify-center gap-1 transition ${
                              isWishlisted
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-red-500' : ''}`} />
                            <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">Discovering personalized courses...</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Profile Update Modal */}
      {dashboardData?.profile && (
        <ProfileUpdateModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={dashboardData.profile}
          onSuccess={() => {
            setIsProfileModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {/* Messages & Notifications Slide-Over Drawer */}
      {activeDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveDrawer(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    {activeDrawer === 'messages' ? <Mail className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {activeDrawer === 'messages' ? 'Messages & Course Q&A' : 'Notifications'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {activeDrawer === 'messages'
                        ? 'Instructor updates, doubts, and student inquiries'
                        : 'Platform updates, deadlines, and alerts'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Switch Tabs */}
              <div className="flex border-b border-slate-100 px-5 bg-white">
                <button
                  onClick={() => setActiveDrawer('messages')}
                  className={`py-3 text-xs font-bold border-b-2 mr-6 transition cursor-pointer flex items-center gap-1.5 ${
                    activeDrawer === 'messages'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Messages</span>
                </button>
                <button
                  onClick={() => setActiveDrawer('notifications')}
                  className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                    activeDrawer === 'notifications'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notifications</span>
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeDrawer === 'messages' ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          Course Q&A Inbox
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Live Sync
                        </span>
                      </div>
                      <p className="text-xs text-indigo-800/80 leading-relaxed">
                        Whenever you ask a doubt in the Course Player Q&A tab, instructor responses are routed directly here and to your notifications.
                      </p>
                    </div>

                    {dashboardData?.notifications?.recent && dashboardData.notifications.recent.length > 0 ? (
                      dashboardData.notifications.recent.map((n: any, idx: number) => (
                        <div
                          key={n.notificationId || idx}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 space-y-2 text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-700">No active doubts or messages</p>
                        <p className="text-[11px] text-slate-400">Post questions in any enrolled course to receive instructor guidance.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData?.notifications?.recent && dashboardData.notifications.recent.length > 0 ? (
                      dashboardData.notifications.recent.map((n: any, idx: number) => (
                        <div
                          key={n.notificationId || idx}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 space-y-2 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400">No unread notifications at this time.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
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
