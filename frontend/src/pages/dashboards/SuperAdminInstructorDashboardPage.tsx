import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { superAdminApi } from '../../api/superAdmin';
import {
  ArrowLeft,
  Shield,
  Eye,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Users,
  IndianRupee,
  Star,
  Video,
  Layers,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  ExternalLink,
  Clock,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { EduLogo } from '../../components/ui/EduLogo';

type SubTab = 'overview' | 'courses' | 'students' | 'webinars' | 'qa' | 'reviews' | 'profile';

export const SuperAdminInstructorDashboardPage: React.FC = () => {
  const { instructorId } = useParams<{ instructorId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    instructor: {
      id: string;
      _id: string;
      name: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      status: string;
      profilePhoto?: string | null;
      joinedDate: string;
      headline?: string;
      bio?: string;
      skills?: string[];
      expertise?: string[];
      workExperience?: string;
      qualification?: string;
      institution?: string;
      rating?: number;
      isVerified: boolean;
      verificationStatus: string;
    };
    dashboardData: any;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const fetchInstructorData = async () => {
    if (!instructorId) {
      setError('No instructor ID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await superAdminApi.getInstructorDashboard(instructorId, timeframe);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError('Could not load instructor dashboard data.');
      }
    } catch (err: any) {
      console.error('Failed to load instructor dashboard for Super Admin:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to retrieve instructor telemetry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorData();
  }, [instructorId, timeframe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#FFCCC2] border-t-[#FA5A36] rounded-full animate-spin" />
          <h3 className="font-bold text-slate-900 text-sm">Loading Instructor Dashboard</h3>
          <p className="text-xs text-slate-500 font-mono">ID: {instructorId}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-rose-200 shadow-lg text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Instructor Dashboard Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'The requested instructor does not exist.'}</p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/super-admin')}
              className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Super Admin</span>
            </button>
            <button
              onClick={fetchInstructorData}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const instructor = data.instructor;
  const dashboardData = data.dashboardData || (data as any).dashboard || {};
  const metrics = dashboardData?.metrics || {};
  const courses: any[] = dashboardData?.courses || [];
  const webinars: any[] = dashboardData?.webinars || [];
  const students: any[] = dashboardData?.students || [];
  const questions: any[] = dashboardData?.recentQuestions || [];
  const reviews: any[] = dashboardData?.reviews || [];

  const filteredCourses = courses.filter((c: any) =>
    c.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    c.category?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredStudents = students.filter((s: any) =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.courseTitle?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-[#FA5A36] selection:text-white pb-16">
      {/* =========================================================================
          1. TOP SUPER ADMIN OVERSIGHT BANNER
         ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <EduLogo size="sm" to="/super-admin" />
            </div>

            <div className="h-5 w-px bg-white/20 hidden md:block" />

            <button
              onClick={() => navigate('/super-admin')}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border border-white/10 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Super Admin</span>
            </button>

            <div className="h-5 w-px bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                    Super Admin View
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate">
                    Viewing dashboard for <strong className="text-white">{instructor.name}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden lg:flex items-center gap-2 text-slate-300 font-mono text-[11px] bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400">ID:</span>
              <span>{instructor.id}</span>
            </div>

            <span className="px-2.5 py-1 bg-[#FA5A36]/10 border border-[#FFCCC2] text-[#FFE6E0] rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#FFCCC2]" />
              <span>Read-Only Oversight</span>
            </span>

            <button
              onClick={() => navigate(`/dashboard/instructor/${instructor.instructorId || instructor.id || instructor._id}`)}
              className="px-3 py-1 bg-[#FA5A36] hover:bg-[#E04322] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Open Full Interactive Instructor Workspace"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Live Workspace</span>
            </button>

            <button
              onClick={fetchInstructorData}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. INSTRUCTOR HEADER CARD & TELEMETRY
         ========================================================================= */}
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#FA5A36] to-[#E04322] text-white flex items-center justify-center font-semibold text-2xl shadow-md overflow-hidden shrink-0">
              {instructor.profilePhoto ? (
                <img
                  src={normalizeImageUrl(instructor.profilePhoto) || undefined}
                  alt={instructor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{instructor.firstName?.[0] || 'I'}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                  {instructor.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                    instructor.verificationStatus === 'VERIFIED' || instructor.isVerified
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {instructor.verificationStatus || 'PENDING'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    instructor.status === 'ACTIVE'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {instructor.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {instructor.headline || 'Verified Course Instructor & Subject Specialist'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{instructor.email}</span>
                </span>
                {instructor.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{instructor.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Joined{' '}
                    {instructor.joinedDate
                      ? new Date(instructor.joinedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Aug 2024'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{instructor.rating || 4.8} Instructor Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-[#FFF5F2] px-3.5 py-2 rounded-xl border border-[#FFCCC2] text-xs font-bold text-[#FA5A36]">
              <Award className="w-4 h-4 text-[#FA5A36]" />
              <span>{courses.length} Published Courses</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. KEY KPI TILES (Real Telemetry from MongoDB)
           ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Enrolled Students</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {metrics.totalStudents ?? students.length}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Active learners enrolled</p>
          </div>

          {/* Card 2: Active Courses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Courses</span>
              <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{courses.length}</p>
            <p className="text-[11px] text-slate-400 font-medium">
              {courses.filter((c: any) => c.status === 'PUBLISHED').length} Published •{' '}
              {courses.filter((c: any) => c.status === 'DRAFT').length} Drafts
            </p>
          </div>

          {/* Card 3: Total Gross Earnings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Total Earnings</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              ₹{(metrics.totalRevenue || metrics.netEarnings || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold">
              ₹{(metrics.availablePayoutBalance || 0).toLocaleString('en-IN')} Available for Disbursal
            </p>
          </div>

          {/* Card 4: Live Classes / Webinars */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Live Webinars</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{webinars.length}</p>
            <p className="text-[11px] text-slate-400 font-medium">Scheduled / Hosted sessions</p>
          </div>
        </div>

        {/* =========================================================================
            4. TABS NAVIGATION
           ========================================================================= */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'courses', label: `Courses (${courses.length})`, icon: BookOpen },
              { id: 'students', label: `Students (${students.length})`, icon: Users },
              { id: 'webinars', label: `Webinars (${webinars.length})`, icon: Video },
              { id: 'qa', label: `Q&A (${questions.length})`, icon: MessageSquare },
              { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
              { id: 'profile', label: 'Instructor Profile & Bio', icon: GraduationCap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SubTab)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FA5A36] text-white shadow-xs shadow-[#FA5A36]/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['7d', '30d', '90d', '1y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer uppercase text-[10px] font-semibold ${
                  timeframe === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            5. TAB CONTENT PANELS
           ========================================================================= */}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Course summary */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">Instructor Courses</h3>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="text-xs font-bold text-[#FA5A36] hover:text-[#FA5A36] cursor-pointer"
                  >
                    View All ({courses.length})
                  </button>
                </div>

                {courses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No courses created yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {courses.slice(0, 4).map((c: any) => (
                      <div key={c._id || c.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {c.thumbnail ? (
                              <img
                                src={normalizeImageUrl(c.thumbnail) || undefined}
                                alt={c.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <BookOpen className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{c.title}</h4>
                            <p className="text-[11px] text-slate-400">
                              {c.category} • ₹{c.price || c.coursePrice || 0} • {c.level || 'Beginner'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              c.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {c.enrolledCount || 0} students
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Community Questions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">Recent Learner Questions</h3>
                  <button
                    onClick={() => setActiveTab('qa')}
                    className="text-xs font-bold text-[#FA5A36] hover:text-[#FA5A36] cursor-pointer"
                  >
                    View Q&A ({questions.length})
                  </button>
                </div>

                {questions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No community questions submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {questions.slice(0, 3).map((q: any) => (
                      <div key={q._id || q.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{q.title || q.question}</span>
                          <span className="text-[10px] text-slate-400">
                            {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2">{q.body || q.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Instructor Bio Snapshot */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="font-semibold text-slate-900 text-sm">Instructor Bio</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {instructor.bio || 'No detailed biography provided by instructor.'}
                </p>

                <div className="pt-2 space-y-3 text-xs border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Skills & Expertise
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(instructor.skills || instructor.expertise || []).length === 0 ? (
                        <span className="text-slate-400 text-[11px]">No tags submitted</span>
                      ) : (
                        (instructor.skills || instructor.expertise || []).map((sk: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-[#FFF5F2] text-[#FA5A36] font-bold text-[10px] border border-[#FFCCC2]"
                          >
                            {sk}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {instructor.workExperience && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Work Experience
                      </span>
                      <p className="text-xs text-slate-700 font-medium">{instructor.workExperience}</p>
                    </div>
                  )}

                  {instructor.qualification && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Education & Qualification
                      </span>
                      <p className="text-xs text-slate-700 font-medium">
                        {instructor.qualification} {instructor.institution ? `at ${instructor.institution}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURSES */}
        {activeTab === 'courses' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">All Instructor Courses</h3>
                <p className="text-xs text-slate-500">Review all courses created and published by {instructor.name}.</p>
              </div>
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FA5A36] w-full sm:w-64"
              />
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No courses match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCourses.map((c: any) => (
                  <div
                    key={c._id || c.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-sm transition"
                  >
                    <div>
                      <div className="h-36 bg-slate-200 relative overflow-hidden">
                        {c.thumbnail ? (
                          <img
                            src={normalizeImageUrl(c.thumbnail) || undefined}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <BookOpen className="w-8 h-8" />
                          </div>
                        )}
                        <span
                          className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            c.status === 'PUBLISHED'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#FA5A36] font-bold">
                          <span>{c.category || 'Development'}</span>
                          <span>{c.level || 'All Levels'}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{c.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {c.shortDescription || c.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 text-sm">₹{c.price || c.coursePrice || 0}</span>
                      <span className="text-slate-500">{c.enrolledCount || 0} Enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENTS */}
        {activeTab === 'students' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Enrolled Students</h3>
                <p className="text-xs text-slate-500">Learners enrolled in courses taught by {instructor.name}.</p>
              </div>
              <input
                type="text"
                placeholder="Search students or course..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FA5A36] w-full sm:w-64"
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No student enrollment records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Enrolled Course</th>
                      <th className="py-3 px-4">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{s.name || 'Student'}</td>
                        <td className="py-3 px-4 text-slate-600">{s.email || '-'}</td>
                        <td className="py-3 px-4 font-medium text-[#FA5A36]">{s.courseTitle || 'Course'}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WEBINARS */}
        {activeTab === 'webinars' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Live Webinars</h3>
              <p className="text-xs text-slate-500">Interactive live masterclasses hosted by {instructor.name}.</p>
            </div>

            {webinars.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No webinars scheduled for this instructor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {webinars.map((w: any) => (
                  <div key={w._id || w.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2]">
                        {w.category || 'Webinar'}
                      </span>
                      <span className="font-bold text-slate-900">₹{w.price || 0}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{w.title}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {w.startTime ? new Date(w.startTime).toLocaleString() : 'Scheduled'}
                    </p>
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-slate-600 font-medium">
                      <span>Capacity: {w.capacity || 100}</span>
                      <span className="text-emerald-700 font-bold">{w.status || 'SCHEDULED'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Q&A */}
        {activeTab === 'qa' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Community Questions & Answers</h3>
              <p className="text-xs text-slate-500">Student queries in {instructor.name}'s courses.</p>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No Q&A activity recorded.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q: any) => (
                  <div key={q._id || q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{q.title || q.question}</h4>
                      <span className="text-[10px] text-slate-400">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-600">{q.body || q.description}</p>
                    {q.answers && q.answers.length > 0 && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1 mt-2">
                        <span className="text-[10px] font-bold text-[#FA5A36] uppercase">Instructor Response:</span>
                        <p className="text-xs text-slate-800">{q.answers[0].answerText || q.answers[0].body}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Student Ratings & Reviews</h3>
              <p className="text-xs text-slate-500">Feedback submitted for {instructor.name}'s courses.</p>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No reviews submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: r.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium italic">"{r.comment || r.review || 'Great course!'}"</p>
                    <span className="text-[10px] text-slate-400 block pt-1 font-semibold">
                      — {r.studentName || 'Verified Student'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 max-w-4xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Instructor Background & Credentials</h3>
              <p className="text-xs text-slate-500">Profile information and credentials verified during onboarding.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Full Legal Name
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{instructor.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </span>
                  <p className="font-bold text-slate-900">{instructor.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </span>
                  <p className="font-bold text-slate-900">{instructor.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Verification Status
                  </span>
                  <p className="font-bold text-emerald-700">{instructor.verificationStatus || 'VERIFIED'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Professional Headline
                  </span>
                  <p className="font-bold text-slate-900">{instructor.headline || 'Instructor'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Work Experience
                  </span>
                  <p className="font-bold text-slate-900">{instructor.workExperience || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Qualification & Alma Mater
                  </span>
                  <p className="font-bold text-slate-900">
                    {instructor.qualification || 'Higher Education'} {instructor.institution ? `(${instructor.institution})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Account Status
                  </span>
                  <p className="font-bold text-blue-700">{instructor.status}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Detailed Biography
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {instructor.bio || 'No biography recorded.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
