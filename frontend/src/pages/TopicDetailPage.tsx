import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  PlayCircle,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { learningPathsApi, type TopicDetailResponse } from '../api/learningPaths';

export const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const [topicDetail, setTopicDetail] = useState<TopicDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (topicId) {
      fetchTopic(topicId);
    }
  }, [topicId]);

  const fetchTopic = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await learningPathsApi.getTopicDetail(id);
      setTopicDetail(data);
    } catch (err: any) {
      console.error('Failed to load topic detail:', err);
      setError('Unable to load topic and tutor offerings from the marketplace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800 p-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 bg-slate-900/40 rounded-3xl border border-slate-800" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-3xl p-12 text-center text-rose-300">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Topic Not Found</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">{error}</p>
            <Link
              to="/learning-paths"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Back to Learning Paths
            </Link>
          </div>
        )}

        {/* Topic & Offerings Marketplace Content */}
        {!isLoading && !error && topicDetail && (
          <div className="space-y-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/learning-paths" className="hover:text-indigo-400 transition-colors">
                Learning Paths
              </Link>
              <span>/</span>
              {topicDetail.course && (
                <>
                  <Link to={`/courses/${topicDetail.course.slug}`} className="hover:text-indigo-400 transition-colors">
                    {topicDetail.course.title}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-slate-200 font-semibold">{topicDetail.title}</span>
            </nav>

            {/* Canonical Topic Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wide">
                    Canonical Subject
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold uppercase">
                    {topicDetail.difficulty}
                  </span>
                  {topicDetail.module && (
                    <span className="text-xs text-slate-400">
                      Module: <span className="text-slate-200">{topicDetail.module.title}</span>
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {topicDetail.title}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {topicDetail.description}
                </p>

                {/* Skills tags */}
                {Array.isArray(topicDetail.skills) && topicDetail.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {topicDetail.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-800/90 text-indigo-300 text-xs font-medium rounded-lg border border-slate-700/80"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Marketplace Section Header */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <Users className="w-6 h-6 text-indigo-400" />
                    <span>Available Tutor Offerings</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {topicDetail.offeringsCount} {topicDetail.offeringsCount === 1 ? 'Tutor' : 'Tutors'}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Select a tutor content offering tailored to your learning style. Each offering is an independent
                    packaged course.
                  </p>
                </div>
              </div>
            </div>

            {/* Empty Offerings State */}
            {topicDetail.offerings.length === 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <Users className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No Tutor Offerings Published Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  This topic currently has no published learning offerings from accredited instructors.
                </p>
              </div>
            )}

            {/* Multi-Tutor Offerings Grid */}
            {topicDetail.offerings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topicDetail.offerings.map((offering) => (
                  <div
                    key={offering.id}
                    className={`group relative bg-slate-900/80 border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                      offering.isPurchased
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10'
                    }`}
                  >
                    <div>
                      {/* Tutor Profile Header */}
                      <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-800/80">
                        {offering.instructor.avatar ? (
                          <img
                            src={offering.instructor.avatar}
                            alt={offering.instructor.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-base">
                            {offering.instructor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            {offering.instructor.name}
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {offering.instructor.headline || 'Senior Engineering Instructor'}
                          </div>
                        </div>
                      </div>

                      {/* Offering Title & Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md uppercase">
                            {offering.level}
                          </span>
                          {offering.isPurchased && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Enrolled
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {offering.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {offering.description}
                        </p>
                      </div>

                      {/* Curriculum Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{offering.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          <span>{offering.totalLessons} Lessons</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA Button */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Tutor Price</div>
                        <div className="text-xl font-extrabold text-white">
                          ₹{offering.price}
                        </div>
                      </div>

                      <Link
                        to={`/offerings/${offering.id}`}
                        className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          offering.isPurchased
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20'
                        }`}
                      >
                        {offering.isPurchased ? (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            <span>Start Learning</span>
                          </>
                        ) : (
                          <>
                            <span>View Offering</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
