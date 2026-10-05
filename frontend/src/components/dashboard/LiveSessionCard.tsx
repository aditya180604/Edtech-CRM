import React from 'react';
import type { UpcomingLiveSession } from '../../types/studentDashboard';
import { Calendar, Video, ArrowRight } from 'lucide-react';

interface LiveSessionCardProps {
  sessions: UpcomingLiveSession[];
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ sessions }) => {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  const priorityBadgeLabels: Record<string, { label: string; color: string }> = {
    BOOKED: { label: 'Booked Seat', color: 'bg-emerald-50 text-emerald-700' },
    ENROLLED_COURSE: { label: 'Course Workshop', color: 'bg-indigo-50 text-indigo-700' },
    ENROLLED_TOPIC: { label: 'Topic Masterclass', color: 'bg-blue-50 text-blue-700' },
    INTEREST_MATCH: { label: 'Interest Match', color: 'bg-purple-50 text-purple-700' },
    PUBLIC: { label: 'Open Webinar', color: 'bg-slate-100 text-slate-700' },
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Upcoming Live Sessions</h3>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {sessions.map((session) => {
          const badge = priorityBadgeLabels[session.priorityReason] || priorityBadgeLabels.PUBLIC;
          const formattedDate = new Date(session.scheduledAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={session.sessionId} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {(session.status === 'Started' || session.isLive || new Date(session.scheduledAt).getTime() <= Date.now()) ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      Started
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                  {session.title}
                </h4>
                <p className="text-[11px] text-slate-500">Instructor: {session.instructorName}</p>
              </div>

              {session.meetingUrl ? (
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl transition-colors shrink-0 shadow-xs flex items-center gap-1"
                >
                  <span>Join Live Meeting ↗</span>
                </a>
              ) : session.isBooked ? (
                <span className="text-[11px] text-slate-400 italic">Starting soon...</span>
              ) : (
                <button className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer flex items-center gap-1">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
