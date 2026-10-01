import React from 'react';
import type { StudentDashboardStreak } from '../../types/studentDashboard';
import { Flame, CheckCircle2, Clock } from 'lucide-react';

interface StreakCardProps {
  streak: StudentDashboardStreak;
}

export const StreakCard: React.FC<StreakCardProps> = ({ streak }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            streak.currentStreak > 0
              ? 'bg-amber-50 text-amber-500 shadow-xs'
              : 'bg-slate-100 text-slate-400'
          }`}>
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Learning Streak</h3>
            <p className="text-xs text-slate-500">
              {streak.currentStreak === 1 ? '1 Day Streak' : `${streak.currentStreak} Days Streak`}
            </p>
          </div>
        </div>

        {streak.isActiveToday ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Today</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Not Yet Today</span>
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        {streak.currentStreak > 0
          ? 'Keep up the momentum! Watch ≥20% of a lesson video, pass a quiz, or attend a live session today to extend your streak.'
          : 'Complete any lesson, pass a quiz, or watch ≥5 mins of a video today to start your streak!'}
      </p>
    </div>
  );
};
