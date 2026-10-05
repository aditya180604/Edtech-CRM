import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { instructorApi } from '../api/instructor';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  Briefcase,
  User,
  Mail,
  GraduationCap,
  LogOut,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

export const InstructorLobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const checkStatus = useCallback(async (isManual = false) => {
    try {
      if (isManual) setChecking(true);
      const res = await instructorApi.getProfile();
      if (res.success && res.data) {
        const prof = res.data.profile || {};
        setProfileData(prof);
        const status = prof.verificationStatus || 'PENDING';
        setVerificationStatus(status);
        setRejectionReason(prof.rejectionReason || null);

        if (status === 'VERIFIED' || status === 'APPROVED') {
          setIsApproved(true);
          if (isManual) {
            toast.success('Congratulations! Profile Approved', 'Redirecting to your Instructor Dashboard...');
          }
          setTimeout(() => {
            navigate('/dashboard/instructor');
          }, 1500);
        } else if (isManual) {
          toast.info('Status Checked', 'Your application is still under Super Admin review.');
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile status in lobby:', err);
    } finally {
      setLoading(false);
      if (isManual) setChecking(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    checkStatus(false);
    // Poll every 12 seconds in background
    const interval = setInterval(() => {
      checkStatus(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-slate-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
              E
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">Edtech<span className="text-indigo-600">CRM</span></span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline-block">
              Logged in as <strong className="text-slate-800">{user?.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center">
        {/* Approved Celebration Banner (if transition happens) */}
        {isApproved && (
          <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 shrink-0 text-white" />
              <div>
                <h3 className="font-extrabold text-base">Your Instructor Account is Approved!</h3>
                <p className="text-xs text-emerald-100">Unlocking your teaching workspace and redirecting to your dashboard...</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/instructor')}
              className="px-4 py-2 bg-white text-emerald-800 font-black rounded-xl text-xs shadow-md cursor-pointer hover:bg-emerald-50 transition"
            >
              Go Now ↗
            </button>
          </div>
        )}

        {/* Rejection Alert */}
        {verificationStatus === 'REJECTED' && (
          <div className="mb-6 p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-rose-900">Application Needs Revision</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  {rejectionReason || 'Your submitted details could not be verified by the Super Admin team.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/instructor/onboarding')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition whitespace-nowrap"
            >
              Edit & Re-submit Profile
            </button>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/80 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/80 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse text-amber-600" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Pending Super Admin Verification</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Application Under Review
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Thank you for submitting your instructor credentials. Access to the dashboard is held until approved.
                </p>
              </div>
            </div>

            <button
              onClick={() => checkStatus(true)}
              disabled={checking}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Status'}</span>
            </button>
          </div>

          {/* 4-Step Progress Indicator */}
          <div className="py-8 relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Onboarding & Approval Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Step 1</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="font-bold text-xs text-slate-900">Account Created</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Email verified & role assigned</p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Step 2</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="font-bold text-xs text-slate-900">Profile Submitted</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Expertise & bio recorded</p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-sm shadow-amber-200/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Step 3 • Active</span>
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                </div>
                <p className="font-extrabold text-xs text-amber-950">Super Admin Review</p>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">Profile awaiting approval</p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 4</span>
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <p className="font-bold text-xs text-slate-700">Dashboard Unlocked</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Course creation enabled</p>
              </div>
            </div>
          </div>

          {/* Submission Details Summary Box */}
          <div className="mt-2 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Submitted Profile Summary (Visible to Super Admin)</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Submitted on {profileData?.submittedAt ? new Date(profileData.submittedAt).toLocaleDateString() : 'Today'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                  {profileData?.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {profileData?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Instructor'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {profileData?.currentOrganization || 'Independent Instructor'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {profileData?.workExperience || 'Educator'} • {profileData?.yearsOfExperience || profileData?.experience || '3+'} Years Exp
                  </p>
                </div>
              </div>
            </div>

            {profileData?.bio && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1 text-[11px]">Professional Bio:</span>
                <p className="text-slate-600 leading-relaxed italic text-[11px]">
                  "{profileData.bio}"
                </p>
              </div>
            )}

            {profileData?.expertise && profileData.expertise.length > 0 && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1.5 text-[11px]">Declared Expertise & Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {profileData.expertise.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Explanatory Footer Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-slate-800">What happens next?</strong>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Super Admins verify credentials to maintain high curriculum standards. Once approved, this screen will automatically refresh and grant you full access to the Instructor Studio.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-slate-800">Need priority review?</strong>
              <p className="text-slate-500 mt-1 leading-relaxed">
                Reach out to administrator support at{' '}
                <a href="mailto:admin@edtech.com" className="text-indigo-600 font-bold hover:underline">
                  admin@edtech.com
                </a>{' '}
                with your portfolio link for accelerated verification.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Edtech CRM Platform. All rights reserved.
      </footer>
    </div>
  );
};
