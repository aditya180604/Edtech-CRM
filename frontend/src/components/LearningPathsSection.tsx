import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Clock, ArrowRight, GitFork, AlertCircle } from 'lucide-react';
import { catalogApi, type CatalogLearningPath } from '../api/catalog';


export const LearningPathsSection: React.FC = () => {
  const [paths, setPaths] = useState<CatalogLearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getLearningPaths({ limit: 4 })
      .then((data) => {
        const safePaths = Array.isArray(data) ? data : (data as any)?.learningPaths || [];
        // Strictly show only the 4 latest learning paths
        setPaths(safePaths.slice(0, 4));
      })
      .catch((err) => {
        console.error('Failed to load learning paths:', err);
        setError('Unable to load career tracks.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <section className="py-10 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Learning Paths
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Structured career curriculums designed to take you from beginner to professional
          </p>
        </div>
        <Link
          to="/learning-paths"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FA5A36] hover:text-[#E04322] transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3">
              <div className="aspect-16/10 bg-slate-200 rounded-xl w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-xs text-rose-700">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && paths.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
          <GitFork className="w-8 h-8 text-[#FA5A36] mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No career paths created yet</h3>
          <p className="text-xs text-slate-500">Comprehensive role tracks are being curated.</p>
        </div>
      )}

      {/* Grid / Mobile Carousel */}
      {!isLoading && !error && paths.length > 0 && (
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pb-3 sm:pb-0 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {paths.map((path) => (
            <Link
              key={path.id}
              to={path.slug ? `/learning-paths/${path.slug}` : `/learning-paths`}
              className="w-[78vw] max-w-[280px] sm:w-auto shrink-0 snap-center group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-[#FA5A36]/10 hover:-translate-y-1 transition-all duration-150 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail / Career Track Header */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 flex items-center justify-center p-4">
                  <div className="text-center text-white space-y-1">
                    <span className="text-[10px] uppercase font-semibold tracking-widest text-[#FFCCC2]">Career Track</span>
                    <h4 className="text-sm font-semibold text-white line-clamp-1">{path.career || path.title}</h4>
                  </div>
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium rounded-md uppercase tracking-wider">
                    {(path.level || 'All Levels').replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4.5">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-[#FA5A36] transition-colors leading-snug mb-1.5">
                    {path.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {path.description || 'Step-by-step curated curriculum taking you to career readiness.'}
                  </p>
                </div>
              </div>

              {/* Footer with Domains, Topics & Duration */}
              <div className="px-4.5 pb-4.5 pt-2.5 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#FA5A36]" />
                    {(path as any).domainsCount !== undefined 
                      ? `${(path as any).domainsCount} Domains` 
                      : (path.coursesCount || '1 Domain')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {(path as any).estimatedDuration || path.duration || 'Self-paced'}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] flex items-center justify-center group-hover:bg-[#FA5A36] group-hover:text-white transition-colors">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};
