import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Video, ArrowRight, CheckCircle2, ExternalLink, CreditCard } from 'lucide-react';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { webinarsApi, type WebinarItem } from '../api/webinars';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useToast } from '../context/ToastContext';

interface LiveWebinarsSectionProps {
  showIfEmpty?: boolean;
}

export const LiveWebinarsSection: React.FC<LiveWebinarsSectionProps> = ({ showIfEmpty = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const { success, error: toastError, info } = useToast();

  const [webinars, setWebinars] = useState<WebinarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [localRegistered, setLocalRegistered] = useState<Record<string, boolean>>({});

  const fetchWebinars = useCallback(async () => {
    try {
      setLoading(true);
      const res = await webinarsApi.getUpcomingWebinars();
      if (res.success && res.data) {
        setWebinars(res.data.webinars || []);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming webinars:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebinars();

    const handleUpdate = () => fetchWebinars();
    window.addEventListener('webinarsChanged', handleUpdate);
    return () => {
      window.removeEventListener('webinarsChanged', handleUpdate);
    };
  }, [fetchWebinars]);

  const handleRegister = async (webinar: WebinarItem) => {
    if (!isAuthenticated) {
      info('Login Required', 'Please log in or sign up to register for this webinar.');
      openLogin();
      return;
    }

    const webinarId = webinar.id || webinar._id;

    // CASE A: FREE WEBINAR (0 or not set) -> Run exactly as old flow without payment!
    if (!webinar.price || Number(webinar.price) <= 0) {
      try {
        setRegisteringId(webinarId);
        const res = await webinarsApi.register(webinarId);
        if (res.success) {
          setLocalRegistered((prev) => ({ ...prev, [webinarId]: true }));
          success('Success', `You have successfully registered for "${webinar.title}"! You will receive a notification on your dashboard when the session starts.`);
          window.dispatchEvent(new Event('webinarsChanged'));
          await fetchWebinars();
        }
      } catch (err: any) {
        console.error('Webinar registration failed:', err);
        toastError('Registration Failed', err.response?.data?.message || 'Could not complete registration.');
      } finally {
        setRegisteringId(null);
      }
      return;
    }

    // CASE B: PAID WEBINAR -> Cashfree Sandbox Checkout
    try {
      setRegisteringId(webinarId);
      info('Initializing Payment', `Creating secure Cashfree checkout for ₹${webinar.price}...`);

      const checkoutRes = await webinarsApi.createCheckoutOrder(webinarId);
      if (!checkoutRes.success) {
        throw new Error(checkoutRes.data?.message || 'Could not initialize checkout');
      }

      // If server confirmed already registered
      if (checkoutRes.data?.registered) {
        setLocalRegistered((prev) => ({ ...prev, [webinarId]: true }));
        success('Already Registered', `You are already registered for "${webinar.title}".`);
        return;
      }

      const { paymentSessionId, orderId, environment } = checkoutRes.data;
      if (!paymentSessionId || !orderId) {
        throw new Error('Cashfree payment session was not returned by server.');
      }

      const cfMode =
        ((environment || '').toLowerCase() === 'production' ||
         (import.meta.env.VITE_CASHFREE_ENV || '').toLowerCase() === 'production')
          ? 'production'
          : 'sandbox';

      const cashfree: any = await loadCashfree({ mode: cfMode });
      if (!cashfree) {
        throw new Error('Unable to load Cashfree payment SDK.');
      }

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: '_modal',
      });

      // Verify payment with backend
      try {
        const verifyRes = await webinarsApi.verifyPayment(webinarId, orderId);
        if (verifyRes.success) {
          setLocalRegistered((prev) => ({ ...prev, [webinarId]: true }));
          success(
            'Payment Verified & Confirmed!',
            `You have successfully purchased your ticket for "${webinar.title}". Your room link is unlocked.`
          );
          window.dispatchEvent(new Event('webinarsChanged'));
          await fetchWebinars();
        }
      } catch (vErr: any) {
        console.error('Payment verification failed:', vErr);
        toastError('Payment Verification', vErr.response?.data?.message || 'Payment not completed.');
      }
    } catch (err: any) {
      console.error('Webinar checkout error:', err);
      toastError('Payment Error', err.response?.data?.message || err.message || 'Payment was cancelled or failed.');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleJoinLive = (webinar: WebinarItem) => {
    const isRegistered = webinar.isUserRegistered || localRegistered[webinar.id || webinar._id];
    if (!isRegistered) {
      info(
        webinar.price > 0 ? 'Ticket Required' : 'Registration Required',
        webinar.price > 0
          ? `Please complete ticket payment of ₹${webinar.price} to join this live workshop.`
          : 'Please register for this webinar before joining the waiting room.'
      );
      handleRegister(webinar);
      return;
    }

    if (webinar.meetingUrl) {
      if (webinar.meetingUrl.startsWith('/webinars/live/') || webinar.meetingUrl.startsWith('/webinar/live/')) {
        navigate(webinar.meetingUrl.replace('/webinar/live/', '/webinars/lobby/').replace('/webinars/live/', '/webinars/lobby/'));
      } else {
        window.open(webinar.meetingUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (webinar.roomCode) {
      navigate(`/webinars/lobby/${webinar.roomCode}`);
    } else {
      info('Session Starting', 'The instructor is launching the live session. Please refresh in a moment.');
    }
  };

  if (loading && webinars.length === 0) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FA5A36] border-t-transparent"></div>
      </div>
    );
  }

  if (webinars.length === 0) {
    if (!showIfEmpty) return null;
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No Scheduled Webinars</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          There are currently no active or upcoming live workshops. As soon as an instructor schedules a session, it will automatically appear here.
        </p>
        <Link
          to="/courses"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#FA5A36] hover:bg-[#e04825] text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <span>Explore Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <section className="py-10 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time interactive sessions with expert instructors. Chronologically ordered by start time.
          </p>
        </div>
        <span className="text-xs font-semibold text-[#FA5A36] bg-[#FFF5F2] border border-[#FFCCC2] px-3 py-1 rounded-full">
          {webinars.length} {webinars.length === 1 ? 'Session Scheduled' : 'Sessions Scheduled'}
        </span>
      </div>

      {/* Clean Modern Grid Without Placeholder Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webinars.map((webinar) => {
          const isRegistered = webinar.isUserRegistered || localRegistered[webinar.id || webinar._id];
          const isLiveNow = webinar.isLive;
          const isRegistering = registeringId === (webinar.id || webinar._id);

          return (
            <div
              key={webinar.id || webinar._id}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isLiveNow
                  ? 'border-red-300 shadow-md ring-2 ring-red-500/20'
                  : 'border-slate-200/80 shadow-xs hover:shadow-lg hover:border-[#FFCCC2] hover:-translate-y-0.5'
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Header Status & Category Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {webinar.category || 'General'}
                  </span>

                  {isLiveNow ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white flex items-center gap-1.5 shadow-xs shadow-red-500/30 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      LIVE NOW
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#FA5A36]" />
                      UPCOMING
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
                  {webinar.title}
                </h3>

                {/* Instructor Card */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-[#FA5A36] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                    {webinar.instructorName[0] || 'I'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {webinar.instructorName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-normal">Instructor</p>
                  </div>
                </div>

                {/* Date & Time Capsule - Chronologically Highlighted */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-2 font-medium">
                      <Calendar className="w-4 h-4 text-[#FA5A36] shrink-0" />
                      <span>{webinar.date}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-[#FA5A36] bg-white border border-[#FFCCC2]/60 px-2 py-0.5 rounded-lg shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-[#FA5A36] shrink-0" />
                      <span>{webinar.time}</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-800 font-semibold">{webinar.registrationsCount ?? 0}</strong> Registered
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900">
                      {webinar.price > 0 ? `₹${webinar.price.toLocaleString('en-IN')}` : 'Free Workshop'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Action Button */}
              <div className="p-6 pt-0">
                {isLiveNow ? (
                  /* Live Now State: Direct Join Live Button */
                  <button
                    type="button"
                    onClick={() => handleJoinLive(webinar)}
                    disabled={isRegistering}
                    className="w-full py-3 bg-[#FA5A36] hover:bg-[#e04825] text-white font-semibold text-xs rounded-2xl shadow-sm shadow-[#FA5A36]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                  >
                    {isRegistering ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        <span>
                          {(webinar.price || 0) > 0 && !isRegistered
                            ? `Pay ₹${webinar.price.toLocaleString('en-IN')} & Join Live`
                            : '🔴 Join Live Session Now'}
                        </span>
                      </>
                    )}
                  </button>
                ) : isRegistered ? (
                  /* Already Registered State */
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-default"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registered ✓ (Unlocks at {webinar.time})</span>
                  </button>
                ) : (
                  /* Upcoming Registration Action */
                  <button
                    type="button"
                    onClick={() => handleRegister(webinar)}
                    disabled={isRegistering}
                    className="w-full py-3 bg-[#FA5A36] hover:bg-[#e04825] active:bg-[#c93d1c] text-white font-semibold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isRegistering ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>
                          {(webinar.price || 0) > 0
                            ? `Pay ₹${webinar.price.toLocaleString('en-IN')} & Register`
                            : 'Register Now'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
