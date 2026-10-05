import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getStudentDashboard } from '../../api/studentDashboard';
import type { StudentDashboardData } from '../../types/studentDashboard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DashboardEmptyState } from '../../components/dashboard/DashboardEmptyState';
import { EnrolledCourseCard } from '../../components/dashboard/EnrolledCourseCard';
import { TopicCreditBanner } from '../../components/dashboard/TopicCreditBanner';
import { StreakCard } from '../../components/dashboard/StreakCard';
import { LiveSessionCard } from '../../components/dashboard/LiveSessionCard';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { LiveStartedBanner } from '../../components/dashboard/LiveStartedBanner';
import { ProfileCompletionWidget } from '../../components/dashboard/ProfileCompletionWidget';
import { RecommendationsSection } from '../../components/dashboard/RecommendationsSection';
import { RecentOrdersSection } from '../../components/dashboard/RecentOrdersSection';
import { WishlistSection } from '../../components/dashboard/WishlistSection';
import { normalizeImageUrl } from '../../utils/imageUrl';

import {
  GraduationCap,
  BookOpen,
  Play,
  Clock,
  Award,
  LogOut,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      setError(err?.response?.data?.message || 'Unable to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : dashboardData ? (
          <div className="space-y-8">
            {/* Real-time Live Webinar Started Notification Banner */}
            <LiveStartedBanner />

            {/* 1. Header & Welcome Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/20">
                    {dashboardData.profile.profilePhoto || user?.profilePhoto ? (
                      <img
                        src={normalizeImageUrl(dashboardData.profile.profilePhoto || user?.profilePhoto) || ''}
                        alt={dashboardData.profile.firstName || 'Student'}
                        className="w-full h-full rounded-xl sm:rounded-2xl object-cover bg-slate-900 border border-white/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl sm:rounded-2xl bg-indigo-950 flex items-center justify-center text-indigo-300 font-black text-2xl sm:text-3xl uppercase">
                        {dashboardData.profile.firstName ? dashboardData.profile.firstName.charAt(0) : <GraduationCap className="w-10 h-10" />}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                      Welcome back, {dashboardData.profile.firstName || user?.firstName || 'Student'}!
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                      Student
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Track your modular learning progress, continue active courses, and achieve verifiable certifications.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 rounded-xl p-0.5 border border-white/10">
                  <NotificationBell />
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-indigo-600/50 hover:bg-indigo-600 border border-indigo-500/30 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md transition-colors border border-white/10 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* 2. Top Metric Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {dashboardData.stats.activeCoursesCount}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">Active Courses</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {dashboardData.stats.purchasedTopicsCount}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">Purchased Topics</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {dashboardData.stats.totalLearningHours} hrs
                  </p>
                  <p className="text-xs font-semibold text-slate-500">Learning Time</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {dashboardData.stats.certificatesCount}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">Certificates Earned</p>
                </div>
              </div>
            </div>

            {/* 3. Topic Credit Banner (Opportunity for Course Upgrade) */}
            <TopicCreditBanner upgrades={dashboardData.upgradeOpportunities} />

            {/* 4. Core Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Columns: Enrolled Courses & Learning Progress */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Continue Learning
                    </h2>
                    {dashboardData.activeCourses.length > 0 && (
                      <span className="text-xs font-bold text-slate-500">
                        {dashboardData.activeCourses.length} In Progress
                      </span>
                    )}
                  </div>

                  {dashboardData.activeCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {dashboardData.activeCourses.map((course) => (
                        <EnrolledCourseCard key={course.courseId} course={course} />
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      icon={Compass}
                      title="No Enrolled Courses Yet"
                      description="Discover industry-led courses and modular atomic topics to begin your learning journey."
                      actionText="Explore Course Catalog"
                      actionHref="/courses"
                    />
                  )}
                </div>

                {/* Recommendations Section */}
                <RecommendationsSection recommendations={dashboardData.recommendations} />
              </div>

              {/* Right Column: Widgets & Secondary Signals */}
              <div className="space-y-6">
                {/* Learning Streak */}
                <StreakCard streak={dashboardData.streak} />

                {/* Profile Completion Indicator */}
                <ProfileCompletionWidget
                  profile={dashboardData.profile}
                  onOpenUpdateModal={() => navigate('/profile')}
                />

                {/* Upcoming Live Sessions */}
                <LiveSessionCard sessions={dashboardData.upcomingLiveSessions} />

                {/* Wishlist Items */}
                <WishlistSection wishlist={dashboardData.wishlist} />

                {/* Recent Orders */}
                <RecentOrdersSection orders={dashboardData.recentOrders} />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};
