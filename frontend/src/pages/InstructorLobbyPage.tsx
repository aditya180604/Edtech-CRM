import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { instructorApi } from '../api/instructor';
import { EduLogo } from '../components/ui/EduLogo';
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
  CreditCard,
  DollarSign,
  FileText,
  ShieldAlert,
  Award,
  Layers,
  ChevronRight,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../components/ui/SocialIcons';

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

  // Application Readiness Report State
  const [readinessReport, setReadinessReport] = useState<any>(null);

  // Dynamic Registration Fee State
  const [feeInfo, setFeeInfo] = useState<{
    registrationFeePaid: boolean;
    feeAmount: number;
    currency: string;
    isEnabled: boolean;
    title?: string;
    description?: string;
    paidAt?: string;
    orderId?: string;
  } | null>(null);
  const [payingFee, setPayingFee] = useState(false);
  const [feePaymentState, setFeePaymentState] = useState<
    'IDLE' | 'PROCESSING' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'USER_DROPPED' | 'EXPIRED'
  >('IDLE');

  const checkStatus = useCallback(async (isManual = false) => {
    try {
      if (isManual) setChecking(true);
      const [profileRes, feeRes, readinessRes] = await Promise.all([
        instructorApi.getProfile().catch(() => null),
        instructorApi.getRegistrationFeeInfo().catch(() => null),
        instructorApi.getReadinessReport().catch(() => null),
      ]);

      if (profileRes?.success && profileRes.data) {
        const prof = profileRes.data.profile || {};
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
          toast.info('Status Checked', 'Your application is in the Super Admin verification pipeline.');
        }
      }

      if (feeRes?.success && feeRes.data) {
        setFeeInfo(feeRes.data);
        if (feeRes.data.registrationFeePaid) {
          setFeePaymentState('SUCCESS');
        }
      }

      if (readinessRes?.success && readinessRes.data) {
        setReadinessReport(readinessRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load profile status in lobby:', err);
    } finally {
      setLoading(false);
      if (isManual) setChecking(false);
    }
  }, [navigate, toast]);

  const handlePayRegistrationFee = async () => {
    try {
      setPayingFee(true);
      setFeePaymentState('PROCESSING');
      const orderRes = await instructorApi.createRegistrationFeeOrder();
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to initialize payment session.');
      }

      const sessionData = orderRes.data || orderRes;
      const paymentSessionId = sessionData.paymentSessionId || orderRes.paymentSessionId;
      const orderId = sessionData.orderId || orderRes.orderId;
      const amount = sessionData.amount || orderRes.amount || feeInfo?.feeAmount;

      if (sessionData.alreadyPaid || orderRes.alreadyPaid) {
        setFeePaymentState('SUCCESS');
        toast.success('Registration Fee Paid', 'Your registration fee has been confirmed.');
        checkStatus(false);
        return;
      }

      if (!paymentSessionId) {
        throw new Error('Cashfree payment session ID was not received from server.');
      }

      let cashfree: any = null;
      try {
        cashfree = await loadCashfree({ mode: 'sandbox' });
      } catch (sdkErr) {
        console.warn('Cashfree SDK load warning:', sdkErr);
      }

      if (!cashfree) {
        throw new Error('Could not initialize Cashfree checkout. Please check network connection.');
      }

      let userDropped = false;
      try {
        const result: any = await cashfree.checkout({
          paymentSessionId: paymentSessionId,
          redirectTarget: '_modal',
        });
        if (result?.error) {
          if (
            result.error.code === 'USER_DROPPED' ||
            result.error.message?.toLowerCase().includes('user dropped') ||
            result.error.message?.toLowerCase().includes('closed')
          ) {
            userDropped = true;
          }
        }
      } catch (checkoutErr: any) {
        if (checkoutErr?.message?.toLowerCase().includes('user dropped')) {
          userDropped = true;
        }
      }

      if (userDropped) {
        setFeePaymentState('USER_DROPPED');
        setPayingFee(false);
        return;
      }

      // Verify payment with backend
      const verifyRes = await instructorApi.verifyRegistrationFee({ orderId: orderId });
      if (verifyRes.success && (verifyRes.paymentStatus === 'SUCCESS' || verifyRes.data?.paymentStatus === 'SUCCESS')) {
        setFeePaymentState('SUCCESS');
        toast.success(
          'Registration Fee Verified! ✓',
          `₹${amount} paid via Cashfree. Application readiness score unlocked!`
        );
        checkStatus(false);
      } else {
        setFeePaymentState('FAILED');
        toast.error('Payment Verification Pending', 'Verification in progress, please check in a moment.');
      }
    } catch (err: any) {
      toast.error('Payment Error', err.response?.data?.message || err.message || 'Payment initiation failed.');
      setFeePaymentState('FAILED');
    } finally {
      setPayingFee(false);
    }
  };

  useEffect(() => {
    checkStatus(false);
    const interval = setInterval(() => {
      checkStatus(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleLogout = async () => {
    await logout('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#FA5A36] animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  const isPaid = Boolean(feeInfo?.registrationFeePaid || profileData?.registrationFeePaid);

  // Computed Predicted Approval Readiness Score (0-100)
  const predictedScore = (() => {
    if (typeof readinessReport?.predictedScore === 'number') return readinessReport.predictedScore;
    if (typeof readinessReport?.score === 'number' && readinessReport.score > 0) return readinessReport.score;
    let pts = 0;
    if (user?.profilePhoto || profileData?.profilePhoto) pts += 10;
    if (user?.firstName || profileData?.fullName) pts += 10;
    if (profileData?.currentJobTitle || !profileData?.isEmployed) pts += 10;
    if (profileData?.expertise?.length >= 3) pts += 15;
    else if (profileData?.expertise?.length >= 1) pts += 8;
    if (profileData?.bio?.length >= 100) pts += 15;
    else if (profileData?.bio?.length >= 20) pts += 8;
    if (profileData?.linkedinUrl && profileData?.githubUrl) pts += 10;
    else if (profileData?.linkedinUrl || profileData?.githubUrl) pts += 5;
    if (profileData?.governmentId?.documentUrl) pts += 15;
    if (profileData?.verificationDocuments?.some((d: any) => d.documentType === 'RESUME_CV')) pts += 15;
    return Math.min(100, pts);
  })();

  // Lagging Fields List
  const laggingItems: string[] = (() => {
    if (Array.isArray(readinessReport?.laggingFields) && readinessReport.laggingFields.length > 0) {
      return readinessReport.laggingFields as string[];
    }
    if (Array.isArray(readinessReport?.missingItems) && readinessReport.missingItems.length > 0) {
      return readinessReport.missingItems as string[];
    }
    const missing: string[] = [];
    if (!profileData?.profilePhoto && !user?.profilePhoto) {
      missing.push('Professional Headshot / Profile Photo');
    }
    if (!profileData?.bio || profileData.bio.length < 50) {
      missing.push('Expanded Professional Bio (recommend 50+ characters)');
    }
    if (!profileData?.expertise || profileData.expertise.length < 3) {
      missing.push('At least 3 core technical skill tags');
    }
    if (!profileData?.linkedinUrl) {
      missing.push('LinkedIn Profile URL');
    }
    if (!profileData?.githubUrl) {
      missing.push('GitHub Profile URL');
    }
    if (!profileData?.governmentId?.documentUrl) {
      missing.push('Government-Issued ID Proof document');
    }
    if (!profileData?.verificationDocuments?.some((d: any) => d.documentType === 'RESUME_CV')) {
      missing.push('Curriculum Vitae / Resume (PDF)');
    }
    if (!profileData?.verificationDocuments?.some((d: any) => ['EMPLOYMENT_PROOF', 'CERTIFICATION'].includes(d.documentType))) {
      missing.push('Optional Supporting Certificate / Experience Verification');
    }
    return missing;
  })();

  const approvalLikelihood = predictedScore >= 80 ? 'High' : predictedScore >= 55 ? 'Moderate' : 'Low';

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <EduLogo size="md" to="/" />

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

        {/* Changes Requested Banner */}
        {verificationStatus === 'CHANGES_REQUESTED' && (
          <div className="mb-6 p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-900">Revisions Requested by Review Board</h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  {rejectionReason || 'Please review feedback on your credentials and re-submit required documents.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/instructor/onboarding')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition whitespace-nowrap"
            >
              Update Profile & Docs
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
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
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
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFF5F2]/80 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
                <Clock className="w-8 h-8 animate-pulse text-amber-600" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>{verificationStatus === 'CHANGES_REQUESTED' ? 'Action Required: Revisions Requested' : 'Pending Super Admin Verification'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Application Under Review
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Thank you for submitting your instructor credentials. Access to the dashboard is held until approved.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/instructor/onboarding"
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Edit Profile
              </Link>

              <button
                onClick={() => checkStatus(true)}
                disabled={checking}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-[#FA5A36] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'Checking...' : 'Check Status'}</span>
              </button>
            </div>
          </div>

          {/* Dynamic Registration Fee Action Card (If Required & Unpaid) */}
          {feeInfo && feeInfo.isEnabled && !isPaid && feeInfo.feeAmount > 0 && (
            <div className="my-6 p-6 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-[#FFCCC2] shadow-sm animate-in fade-in relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FA5A36] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FA5A36]/20">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2]">
                        Mandatory Setup Fee
                      </span>
                      <span className="text-xs font-bold text-slate-500">Unlocks Readiness Scoring</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Pay Instructor Registration Fee (₹{feeInfo.feeAmount.toLocaleString('en-IN')})
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                      Complete your one-time onboarding setup fee via Cashfree Payment Gateway to unlock your numerical readiness evaluation report and activate your instructor verification queue.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayRegistrationFee}
                  disabled={payingFee}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#FA5A36]/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {payingFee ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>{payingFee ? 'Opening Secure Checkout...' : `Pay ₹${feeInfo.feeAmount.toLocaleString('en-IN')} Now`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Paid Confirmation Badge (If already paid) */}
          {isPaid && (
            <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-bold animate-in fade-in relative z-10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>✓ Registration Fee Paid & Cashfree Verified (Readiness Scoring Unlocked)</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-mono">
                Order: {feeInfo?.orderId || profileData?.registrationFeeOrderId || 'VERIFIED'}
              </span>
            </div>
          )}

          {/* APPLICATION READINESS & APPROVAL PREDICTION SECTION */}
          <div className="my-6 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative z-10 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Predicted Approval Score & Application Quality</h3>
                  <p className="text-xs text-slate-500">
                    Live estimation of your likelihood of getting verified and approved by the Super Admin board.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  approvalLikelihood === 'High'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : approvalLikelihood === 'Moderate'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{approvalLikelihood} Chance of Approval</span>
                </span>
              </div>
            </div>

            {/* Score Highlight Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                      Approval Probability Index
                    </span>
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                      AI & Criteria Engine
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      {predictedScore}%
                    </span>
                    <span className="text-sm font-semibold text-indigo-200">
                      predicted approval rating
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                    {approvalLikelihood === 'High'
                      ? 'Your profile, verified links, and submitted documents meet top platform quality benchmarks. High probability of prompt admin approval.'
                      : approvalLikelihood === 'Moderate'
                      ? 'Good foundation! Completing the lagging fields below will boost your approval probability to 85%+.'
                      : 'Important credentials or documents are lagging. We recommend updating your application below to avoid delays.'}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-center sm:items-end gap-2">
                  <Link
                    to="/instructor/onboarding"
                    className="px-4 py-2.5 bg-[#FA5A36] hover:bg-[#e04825] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                  >
                    <span>Upload / Fix Lagging Files</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
                  <span>Application Completeness</span>
                  <span>{predictedScore} / 100 Points</span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      predictedScore >= 80
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : predictedScore >= 55
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                        : 'bg-gradient-to-r from-rose-500 to-orange-500'
                    }`}
                    style={{ width: `${Math.max(5, predictedScore)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lagging Fields Analysis */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Fields & Requirements Analysis</span>
                </h4>
                {laggingItems.length > 0 ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {laggingItems.length} {laggingItems.length === 1 ? 'item lagging' : 'items lagging'}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    All requirements satisfied ✓
                  </span>
                )}
              </div>

              {laggingItems.length > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                  <p className="text-xs font-bold text-amber-900 mb-2">
                    Lagging Fields (Updating these increases your chance of admin approval):
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {laggingItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-amber-800 bg-white/90 p-2.5 rounded-xl border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-[11px]">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3.5 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-amber-800">
                      Want to fix these fields or upload new files?
                    </span>
                    <Link
                      to="/instructor/onboarding"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-black underline cursor-pointer"
                    >
                      <span>Return to Onboarding Form</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">All mandatory and recommended documents uploaded!</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Government ID, Resume, LinkedIn, GitHub, and bio are in place.</p>
                    </div>
                  </div>
                  <Link
                    to="/instructor/onboarding"
                    className="px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 hover:bg-emerald-50"
                  >
                    Review / Edit
                  </Link>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            {readinessReport?.breakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Core Profile</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {readinessReport.breakdown.coreProfile?.score ?? 30} / {readinessReport.breakdown.coreProfile?.maxScore ?? 30}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Skills & Subjects</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {readinessReport.breakdown.skillsAndSubjects?.score ?? 15} / {readinessReport.breakdown.skillsAndSubjects?.maxScore ?? 15}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Experience & Bio</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {readinessReport.breakdown.experienceAndBio?.score ?? 15} / {readinessReport.breakdown.experienceAndBio?.maxScore ?? 15}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Professional Links</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {readinessReport.breakdown.professionalLinks?.score ?? 10} / {readinessReport.breakdown.professionalLinks?.maxScore ?? 10}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Government ID</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {readinessReport.breakdown.governmentId?.score ?? 20} / {readinessReport.breakdown.governmentId?.maxScore ?? 20}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Resume & Documents</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {readinessReport.breakdown.supportingDocuments?.score ?? 10} / {readinessReport.breakdown.supportingDocuments?.maxScore ?? 10}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4-Step Progress Pipeline */}
          <div className="py-6 relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Onboarding & Approval Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Step 1</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="font-bold text-xs text-slate-900">Profile & Documents</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Bio, ID & CV submitted</p>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-2xl border ${isPaid ? 'bg-emerald-50/70 border-emerald-100' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>Step 2</span>
                  {isPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600 animate-spin" />}
                </div>
                <p className="font-bold text-xs text-slate-900">Registration Fee</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{isPaid ? 'Cashfree Verified' : 'One-time onboarding fee'}</p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Step 3 • Active</span>
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                </div>
                <p className="font-bold text-xs text-amber-950">Super Admin Review</p>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">Manual verification queue</p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 4</span>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#FA5A36]" />
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
                    {profileData?.currentOrganization || 'Independent Practitioner'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {profileData?.currentJobTitle || profileData?.workExperience || 'Educator'} • {profileData?.yearsOfExperience || profileData?.experience || '3+'} Years Exp
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Links */}
            {(profileData?.linkedinUrl || profileData?.githubUrl || profileData?.portfolioUrl) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {profileData.linkedinUrl && (
                  <a
                    href={profileData.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-bold hover:bg-sky-100 transition"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profileData.githubUrl && (
                  <a
                    href={profileData.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold hover:bg-slate-200 transition"
                  >
                    <GithubIcon className="w-3.5 h-3.5 text-slate-800" />
                    <span>GitHub</span>
                  </a>
                )}
                {profileData.portfolioUrl && (
                  <a
                    href={profileData.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold hover:bg-purple-100 transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            )}

            {/* Document Badges */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2 text-[11px]">Verification Documents:</span>
              <div className="flex flex-wrap gap-2">
                {profileData?.governmentId ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Gov ID: {profileData.governmentId.idType || 'ID Proof'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Gov ID: Not Uploaded</span>
                  </span>
                )}

                {profileData?.verificationDocuments && profileData.verificationDocuments.length > 0 ? (
                  profileData.verificationDocuments.map((doc: any, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold text-[11px]">
                      <FileText className="w-3 h-3 text-indigo-600" />
                      <span>{doc.title || doc.documentType}</span>
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-[11px]">
                    Resume: Optional
                  </span>
                )}
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
                <a href="mailto:admin@vstudyonline.com" className="text-indigo-600 font-bold hover:underline">
                  admin@vstudyonline.com
                </a>{' '}
                with your portfolio link for accelerated verification.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} VStudyOnline Platform. All rights reserved.
      </footer>
    </div>
  );
};
