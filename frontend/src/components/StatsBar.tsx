import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, PlaySquare, Star } from 'lucide-react';
import { catalogApi, type CatalogStat } from '../api/catalog';

export const StatsBar: React.FC = () => {
  const [stats, setStats] = useState<CatalogStat[]>([]);

  useEffect(() => {
    catalogApi
      .getPublicStats()
      .then((data) => {
        if (data && data.length > 0) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
      });
  }, []);

  // Map from existing dynamic stats values while preserving existing data
  const activeLearnersVal = stats.find((s) => s.label.toLowerCase().includes('learner'))?.value || '6';
  const coursesVal = stats.find((s) => s.label.toLowerCase().includes('course'))?.value || '4';
  const instructorsVal = stats.find((s) => s.label.toLowerCase().includes('instructor'))?.value || '5';
  const ratingVal =
    stats.find((s) => s.label.toLowerCase().includes('satisfaction') || s.label.toLowerCase().includes('rating'))
      ?.value || '4.0/5';

  const displayStats = [
    {
      value: activeLearnersVal,
      label: 'Active Learners',
      icon: <Users className="w-6 h-6 text-[#FA5A36]" />,
      iconBg: 'bg-[#FFF5F2] border-[#FFCCC2]',
    },
    {
      value: coursesVal,
      label: 'Courses & Topics',
      icon: <PlaySquare className="w-6 h-6 text-blue-600" />,
      iconBg: 'bg-blue-50 border-blue-100',
    },
    {
      value: instructorsVal,
      label: 'Expert Instructors',
      icon: <GraduationCap className="w-6 h-6 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-100',
    },
    {
      value: ratingVal,
      label: 'Average Rating',
      icon: <Star className="w-6 h-6 text-amber-500 fill-amber-500" />,
      iconBg: 'bg-amber-50 border-amber-100',
    },
  ];

  return (
    <section className="relative -mt-6 sm:-mt-8 z-20 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 py-5 sm:py-6 px-6 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-center divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
        {displayStats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 ${idx !== 0 ? 'pt-3 sm:pt-0 lg:pl-6' : ''}`}
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} border flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-slate-500 whitespace-nowrap">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
