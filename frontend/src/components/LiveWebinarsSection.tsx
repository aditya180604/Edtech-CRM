import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Video, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
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

    try {
      setRegisteringId(webinar.id || webinar._id);
      const res = await webinarsApi.register(webinar.id || webinar._id);
      if (res.success) {
        setLocalRegistered((prev) => ({ ...prev, [webinar.id || webinar._id]: true }));
        success('Success', `You have successfully registered for "${webinar.title}"! You will receive a notification on your dashboard when the session starts.`);
        // Notify all views (Instructor dashboard, navbar, cards) to update registration counts live!
        window.dispatchEvent(new Event('webinarsChanged'));
        await fetchWebinars();
      }
    } catch (err: any) {
      console.error('Webinar registration failed:', err);
      toastError('Registration Failed', err.response?.data?.message || 'Could not complete registration.');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleJoinLive = (webinar: WebinarItem) => {
    if (webinar.meetingUrl) {
      if (webinar.meetingUrl.startsWith('/webinars/live/') || webinar.meetingUrl.startsWith('/webinar/live/')) {
        navigate(webinar.meetingUrl);
      } else {
        window.open(webinar.meetingUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (webinar.roomCode) {
      navigate(`/webinars/live/${webinar.roomCode}`);
    } else {
      info('Session Starting', 'The instructor is launching the live session. Please refresh in a moment.');
    }
  };

  if (loading && webinars.length === 0) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (webinars.length === 0) {
    if (!showIfEmpty) return null;
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Scheduled Webinars</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          There are currently no active or upcoming live workshops. As soon as an instructor schedules a session, it will automatically appear here.
        </p>
        <Link
          to="/courses"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
        >
          <span>Explore Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <section className="py-6 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Live Webinars & Workshops
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time interactive sessions with expert instructors. Chronologically ordered by start time.
          </p>
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          {webinars.length} {webinars.length === 1 ? 'Session Scheduled' : 'Sessions Scheduled'}
        </span>
      </div>

      {/* Clean Modern Grid Without Placeholder Images (Image 2 Redesign) */}
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
                  : 'border-slate-100 shadow-xs hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1'
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Header Status & Category Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                    {webinar.category || 'General'}
                  </span>

                  {isLiveNow ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white flex items-center gap-1.5 shadow-sm shadow-red-500/30 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      LIVE NOW
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      UPCOMING
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2">
                  {webinar.title}
                </h3>

                {/* Instructor Card */}
                <div className="flex items-center gap-2.5 py-2 px-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {webinar.instructorName[0] || 'I'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {webinar.instructorName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">Instructor</p>
                  </div>
                </div>

                {/* Date & Time Capsule - Chronologically Highlighted */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 rounded-2xl border border-indigo-100/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="flex items-center gap-2 font-bold">
                      <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{webinar.date}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{webinar.time}</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-indigo-100/40 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-800">{webinar.registrationsCount ?? 0}</strong> Registered
                      </span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {webinar.price > 0 ? `₹${webinar.price.toLocaleString('en-IN')}` : 'Free Workshop'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Action Button (Requirement 3 & 5) */}
              <div className="p-6 pt-0">
                {isLiveNow ? (
                  /* Live Now State: Direct Join Live Button */
                  <button
                    type="button"
                    onClick={() => handleJoinLive(webinar)}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-red-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>🔴 Join Live Session Now</span>
                  </button>
                ) : isRegistered ? (
                  /* Already Registered State */
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-default"
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
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isRegistering ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Register Now</span>
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
