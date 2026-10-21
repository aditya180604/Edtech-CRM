import React, { useState, useEffect } from 'react';
import { ExternalLink, Video, Clock, X, FileText, Save, Copy, Check, Sparkles } from 'lucide-react';
import { notificationsApi, type ActiveStartedWebinar } from '../../api/notifications';
import { webinarsApi } from '../../api/webinars';
import { useToast } from '../../context/ToastContext';

export const LiveStartedBanner: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [activeWebinars, setActiveWebinars] = useState<ActiveStartedWebinar[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dismissed_webinar_banners') || '[]');
    } catch {
      return [];
    }
  });
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Notes Modal State
  const [notesModalWebinar, setNotesModalWebinar] = useState<{
    id: string;
    title: string;
    roomCode: string;
  } | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

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

  const handleOpenNotes = async (w: ActiveStartedWebinar) => {
    const rawUrl = w.meetingUrl || '';
    const roomCode = rawUrl.split('/').pop() || w.id;
    setNotesModalWebinar({
      id: w.id,
      title: w.title,
      roomCode,
    });
    setNotesText('');
    setIsLoadingNotes(true);

    try {
      // Try getLiveRoom first for direct user notes
      try {
        const roomRes = await webinarsApi.getLiveRoom(roomCode);
        if (roomRes?.data?.userNotes !== undefined) {
          setNotesText(roomRes.data.userNotes || '');
          setIsLoadingNotes(false);
          return;
        }
      } catch {
        // fallback
      }

      const res = await webinarsApi.getWebinarById(roomCode);
      if (res?.data) {
        let loaded = '';
        if (typeof (res.data as any).userNotes === 'string') {
          loaded = (res.data as any).userNotes;
        } else if (Array.isArray((res.data as any).userNotes)) {
          loaded = (res.data as any).userNotes[0]?.notes || '';
        }
        setNotesText(loaded);
      }
    } catch (e) {
      console.warn('Could not load notes:', e);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!notesModalWebinar) return;
    setIsSavingNotes(true);
    try {
      await webinarsApi.saveNotes(notesModalWebinar.roomCode, notesText);
      success('Notes Saved', 'Your workshop notes have been saved.');
    } catch (err: any) {
      toastError('Save Error', err.response?.data?.message || 'Could not save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(notesText || '');
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  // Filter out dismissed webinars and expired webinars (now > endTime)
  const visibleWebinars = activeWebinars.filter((w) => {
    if (dismissedIds.includes(w.id)) return false;
    const endMs = new Date(w.endTime).getTime();
    return endMs > currentTime;
  });

  if (visibleWebinars.length === 0) return null;

  return (
    <>
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
                {/* My Notes Action Button */}
                <button
                  type="button"
                  onClick={() => handleOpenNotes(w)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-emerald-300 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  title="View & Edit Notes"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>My Notes</span>
                </button>

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

      {/* Webinar Notes Modal */}
      {notesModalWebinar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>Workshop Notes</span>
                  </span>
                  <span className="text-xs text-slate-400 font-bold">Private & Auto-Saved</span>
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {notesModalWebinar.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNotesModalWebinar(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#FA5A36]" />
                  <span>These notes are stored in your profile and can be reviewed anytime.</span>
                </span>
                {isLoadingNotes && <span className="text-slate-400 italic">Loading notes...</span>}
              </div>

              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Write your personal notes, commands, key learnings, and Q&A points from this live session..."
                className="w-full flex-1 min-h-[260px] p-4 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FA5A36]/20 focus:border-[#FA5A36] transition leading-relaxed resize-none font-mono"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyNotes}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                {copiedNotes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Notes</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotesModalWebinar(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 bg-[#FA5A36] hover:bg-[#e04825] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
