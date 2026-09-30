import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Clock, ArrowRight } from 'lucide-react';
import { learningPathsData } from '../data/mockData';

export const LearningPathsSection: React.FC = () => {
  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Learning Paths
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Structured career curriculums designed to take you from beginner to professional
          </p>
        </div>
        <Link
          to="/learning-paths"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {learningPathsData.map((path) => (
          <Link
            key={path.id}
            to={`/learning-paths`}
            className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                <img
                  src={path.thumbnail}
                  alt={path.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Career Track
                </span>
              </div>

              {/* Body */}
              <div className="p-4.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1.5">
                  {path.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {path.description}
                </p>
              </div>
            </div>

            {/* Footer with Courses & Duration */}
            <div className="px-4.5 pb-4.5 pt-2.5 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2.5 text-[11px]">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  {path.coursesCount} Courses
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {path.duration}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
