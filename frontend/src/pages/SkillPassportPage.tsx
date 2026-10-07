import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { authApi } from '../api/auth';
import { normalizeImageUrl } from '../utils/imageUrl';
import {
  ShieldCheck,
  Award,
  BookOpen,
  Clock,
  MapPin,
  GraduationCap,
  Briefcase,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface PassportSkill {
  name: string;
  proficiency: number;
  verified: boolean;
  courseTitle?: string;
}

interface PassportCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category?: string;
}

interface SkillPassportData {
  studentId: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  profilePhoto?: string | null;
  institution: string;
  qualification: string;
  graduationYear: number;
  city?: string;
  state?: string;
  country: string;
  memberSince?: string;
  totalLearningHours: number;
  completedLessonsCount: number;
  completedCoursesCount: number;
  skills: PassportSkill[];
  enrolledCourses: PassportCourse[];
  isVerified: boolean;
}

export const SkillPassportPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

  const [passport, setPassport] = useState<SkillPassportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchPassport = async () => {
      if (!identifier) return;
      try {
        setLoading(true);
        setError(null);
        const res = await authApi.getPassport(identifier);
        if (res?.data) {
          setPassport(res.data);
        } else {
          setError('Verified Skill Passport not found.');
        }
      } catch (err: any) {
        console.error('Error fetching passport:', err);
        setError(err?.response?.data?.message || 'Skill Passport could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchPassport();
  }, [identifier]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Breadcrumb & Share Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/student')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Share Passport</span>
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600">Verifying and retrieving authenticated Skill Passport...</p>
          </div>
        ) : error || !passport ? (
          <div className="bg-white rounded-3xl p-12 border border-rose-100 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Skill Passport Unavailable</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">{error || 'Passport could not be found.'}</p>
            <button
              onClick={() => navigate('/dashboard/student')}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Return to Student Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header Passport Credential Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Avatar with Verified Ring */}
                  <div className="relative">
                    {passport.profilePhoto ? (
                      <img
                        src={normalizeImageUrl(passport.profilePhoto) || ''}
                        alt={passport.fullName}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-indigo-400/60 shadow-lg ring-4 ring-indigo-500/20"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 font-black text-3xl flex items-center justify-center border-2 border-indigo-400/60 shadow-lg ring-4 ring-indigo-500/20">
                        {passport.firstName[0]?.toUpperCase() || 'S'}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-slate-900 shadow-md">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Credential
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono font-bold">
                        {passport.studentId}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {passport.fullName}
                    </h1>

                    <p className="text-sm font-semibold text-indigo-200">
                      {passport.headline}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400 font-medium pt-1">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        <span>
                          {passport.institution} • {passport.qualification} ({passport.graduationYear})
                        </span>
                      </div>
                      {(passport.city || passport.country) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {[passport.city, passport.state, passport.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right QR / Authenticity Stamp */}
                <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 text-center shrink-0 w-full md:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-indigo-300 block">
                    EDUTECH LMS
                  </span>
                  <span className="text-[11px] font-bold text-slate-300">
                    Official Recruiter Passport
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Verified via Academic Engine</p>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Learning Hours</span>
                  <span className="text-xl font-black text-white">{passport.totalLearningHours} hrs</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lessons Done</span>
                  <span className="text-xl font-black text-white">{passport.completedLessonsCount}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Courses</span>
                  <span className="text-xl font-black text-white">{passport.completedCoursesCount}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Verified Skills</span>
                  <span className="text-xl font-black text-emerald-400">{passport.skills.length}</span>
                </div>
              </div>
            </div>

            {/* Section: Verified Skills Matrix */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Verified Skill Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authentic competencies calculated dynamically from completed course lessons and topics.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 self-start sm:self-auto">
                  {passport.skills.length} Competencies
                </span>
              </div>

              {passport.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {passport.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 hover:border-indigo-100 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              skill.verified ? 'bg-indigo-600' : 'bg-amber-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900">{skill.name}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-600">{skill.proficiency}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            skill.verified ? 'bg-indigo-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(8, skill.proficiency)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        {skill.courseTitle ? (
                          <span className="truncate max-w-[170px]" title={skill.courseTitle}>
                            From: {skill.courseTitle}
                          </span>
                        ) : (
                          <span>Curriculum Module</span>
                        )}
                        {skill.verified ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Authenticated
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-2 text-slate-400">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">No Course Skills Acquired Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When this student purchases courses and completes lessons, authenticated competencies and skill mastery will appear here in real-time.
                  </p>
                </div>
              )}
            </div>

            {/* Section: Enrolled & Completed Courses */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Courses & Credentials in Progress
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Programs enrolled and verified under this student credential.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {passport.enrolledCourses.length} Enrolled
                </span>
              </div>

              {passport.enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {passport.enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-indigo-100 transition"
                    >
                      {course.thumbnail ? (
                        <img
                          src={normalizeImageUrl(course.thumbnail) || ''}
                          alt={course.title}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <BookOpen className="w-7 h-7" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {course.category || 'Professional Track'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-xs truncate mt-0.5">{course.title}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-1">
                          <ShieldCheck className="w-3 h-3" /> Enrolled & Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No courses enrolled yet.
                </div>
              )}
            </div>

            {/* Recruiter Verification Bottom Note */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  This public Skill Passport is cryptographically tied to student identity <strong className="text-slate-900">{passport.studentId}</strong> on the EduTech platform.
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shrink-0 cursor-pointer text-xs"
              >
                Copy Link to Share
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
