import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  GitFork,
  Search,
  Filter,
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { learningPathsApi, type LearningPathSummary } from '../api/learningPaths';

export const LearningPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL_LEVELS');

  useEffect(() => {
    fetchLearningPaths();
  }, [searchQuery, selectedLevel]);

  const fetchLearningPaths = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await learningPathsApi.getLearningPaths({
        search: searchQuery,
        level: selectedLevel !== 'ALL_LEVELS' ? selectedLevel : undefined,
      });
      setPaths(res.learningPaths || []);
    } catch (err: any) {
      console.error('Failed to load learning paths:', err);
      setError('Unable to load learning paths from catalog. Please refresh or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 mb-10 shadow-sm">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Dynamic Career Roadmaps & Multi-Tutor Marketplace
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Master High-Demand Roles With Structured{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Learning Paths
              </span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              Explore step-by-step roadmaps organized by real engineering domains and topics. Choose your preferred
              expert tutor for each topic independently — no forced lock-in, complete flexibility.
            </p>

            {/* Value Props Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                </div>
                <span>Domain-Driven Subjects</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <span>Competitive Tutor Market</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                </div>
                <span>Isolated Entitlements</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roadmaps by role or skill..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors cursor-pointer"
            >
              <option value="ALL_LEVELS">All Experience Levels</option>
              <option value="BEGINNER">Beginner Friendly</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse space-y-4 shadow-xs"
              >
                <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <div className="h-8 bg-slate-100 rounded-xl" />
                  <div className="h-8 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-700 text-sm">
            <p className="font-semibold mb-2">{error}</p>
            <button
              onClick={fetchLearningPaths}
              className="mt-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && paths.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <GitFork className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
            <h3 className="text-base font-bold text-slate-900">No learning paths match your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or clearing your experience level filter.
            </p>
          </div>
        )}

        {/* Learning Paths Grid */}
        {!isLoading && !error && paths.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path) => (
              <div
                key={path.id}
                className="group relative bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-indigo-300 rounded-3xl p-6 transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge & Level */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wide uppercase">
                        {path.career || 'Career Track'}
                      </span>
                      {path.isEnrolled && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold tracking-wide uppercase">
                          Enrolled
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {path.level.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {path.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {path.description}
                  </p>

                  {/* Skills Tags */}
                  {Array.isArray(path.skills) && path.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {path.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {path.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-semibold">
                          +{path.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Metrics & CTA Footer */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{path.domainsCount} Domains</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{path.topicsCount} Topics</span>
                    </div>
                  </div>

                  <Link
                    to={`/learning-paths/${path.slug}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 group-hover:scale-[1.01]"
                  >
                    <span>Explore Complete Roadmap</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
