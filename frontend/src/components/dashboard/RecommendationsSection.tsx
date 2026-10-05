import React from 'react';
import type { RecommendationItem } from '../../types/studentDashboard';
import { Sparkles, ArrowRight, BookOpen, Compass, Sparkles as SparkleIcon, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecommendationsSectionProps {
  recommendations?: RecommendationItem[];
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">Recommended For You</h2>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
        >
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendations.map((rec) => {
            const currencySymbol = rec.currency === 'INR' ? '₹' : '$';
            return (
              <div
                key={rec.courseId}
                onClick={() => navigate(`/course/${rec.slug}`)}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer group"
              >
                <div>
                  <div className="h-28 rounded-2xl bg-indigo-50/50 mb-3 overflow-hidden flex items-center justify-center relative">
                    {rec.thumbnail ? (
                      <img
                        src={rec.thumbnail}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <BookOpen className="w-10 h-10 text-indigo-200" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 shadow-2xs">
                      {rec.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {rec.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1">{rec.reason}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    {currencySymbol}{rec.coursePrice}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <SparkleIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                No matching courses found for your selected skills right now
              </h3>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Right now we don't have courses directly matching those specific interested skills. If you are interested in other topics or skills, update your profile or explore our full course catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Update Skills</span>
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Catalog</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
