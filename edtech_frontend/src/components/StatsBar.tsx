import React, { useState, useEffect } from 'react';
import { Users, UserCheck, PlaySquare, Layers, Globe, Star } from 'lucide-react';
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-5 h-5 text-indigo-600" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      case 'PlaySquare':
        return <PlaySquare className="w-5 h-5 text-indigo-600" />;
      case 'GitFork':
        return <Layers className="w-5 h-5 text-indigo-600" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-indigo-600" />;
      case 'Star':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      default:
        return <Users className="w-5 h-5 text-indigo-600" />;
    }
  };

  if (stats.length === 0) {
    return null;
  }

  return (
    <section className="relative -mt-6 sm:-mt-8 z-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-4.5 px-6 sm:px-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-center divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3.5 ${idx !== 0 ? 'pt-3 sm:pt-0 lg:pl-6' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50/70 border border-indigo-100/50 flex items-center justify-center shrink-0">
              {getIcon(stat.icon)}
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black text-slate-900 leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-slate-500 whitespace-nowrap">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
