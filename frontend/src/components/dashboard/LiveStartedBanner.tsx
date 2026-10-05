import React, { useState, useEffect } from 'react';
import { ExternalLink, Video, Clock, X } from 'lucide-react';
import { notificationsApi, type ActiveStartedWebinar } from '../../api/notifications';

export const LiveStartedBanner: React.FC = () => {
  const [activeWebinars, setActiveWebinars] = useState<ActiveStartedWebinar[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissed_webinar_banners') || '[]');
    } catch {
      return [];
    }
  });
  const [currentTime, setCurrentTime] = useState(Date.now());

  const fetchActive = async () => {
    try {
      const res = await notificationsApi.getNotifications();
      if (res.success && res.data) {
        setActiveWebinars(res.data.activeStartedWebinars || []);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchActive();
    const interval = setInterval(() => {
      fetchActive();
      setCurrentTime(Date.now());
    }, 10000);

    const handleWebinarsChanged = () => fetchActive();
    window.addEventListener('webinarsChanged', handleWebinarsChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener('webinarsChanged', handleWebinarsChanged);
    };
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('dismissed_webinar_banners', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Filter out dismissed webinars and expired webinars (now > endTime)
  const visibleWebinars = activeWebinars.filter((w) => {
    if (dismissedIds.includes(w.id)) return false;
    const endMs = new Date(w.endTime).getTime();
    return endMs > currentTime;
  });

  if (visibleWebinars.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleWebinars.map((w) => {
        const endMs = new Date(w.endTime).getTime();
        const remainingMinutes = Math.max(0, Math.floor((endMs - currentTime) / 60000));
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;
        const remainingLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;
        const expiryTimeStr = new Date(w.endTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={w.id}
            className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-2 border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 animate-pulse">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                    Started
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {w.category || 'Live Session'}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base mt-0.5">
                  {w.title} is now LIVE!
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {w.isInstructor
                    ? 'Your live session has started. Attendees are in the room waiting for you to host.'
                    : 'The webinar has officially started! Join the live room immediately.'}
                </p>

                {/* Expiry Date & Time Indicator */}
                <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1.5 mt-1.5 bg-white/80 px-2.5 py-1 rounded-xl border border-emerald-200/60 w-fit">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Expires at {expiryTimeStr} (Time remaining: {remainingLabel})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {w.meetingUrl ? (
                <a
                  href={w.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{w.isInstructor ? 'Host Live Session ↗' : 'Join Live Meeting ↗'}</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400 font-semibold italic">
                  Meeting room launching...
                </span>
              )}

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => handleDismiss(w.id)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
