import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-slate-200 rounded-full" />
            <div className="w-48 sm:w-64 h-7 bg-slate-200 rounded-lg" />
            <div className="w-36 h-4 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="w-24 h-9 bg-slate-200 rounded-xl" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-12 h-6 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-64 bg-slate-200 rounded-3xl" />
        </div>
        <div className="space-y-6">
          <div className="h-56 bg-slate-200 rounded-3xl" />
          <div className="h-56 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    </div>
  );
};
