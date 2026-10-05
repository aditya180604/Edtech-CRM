import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Layers,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award,
  PlayCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { learningPathsApi, type LearningPathDetail } from '../api/learningPaths';
import { useAuth } from '../context/AuthContext';

export const LearningPathDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [pathDetail, setPathDetail] = useState<LearningPathDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (slug) {
      fetchRoadmap(slug);
    }
  }, [slug]);

  const fetchRoadmap = async (pathSlug: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await learningPathsApi.getLearningPathBySlug(pathSlug);
      setPathDetail(data);

      // Expand all domains by default
      const initialExpanded: Record<string, boolean> = {};
      if (data && data.domains) {
        data.domains.forEach((d) => {
          initialExpanded[d.id] = true;
        });
      }
      setExpandedDomains(initialExpanded);
    } catch (err: any) {
      console.error('Failed to load learning path roadmap:', err);
      setError('Unable to load learning path roadmap from the database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/learning-paths/${slug}`);
      return;
    }

    if (!pathDetail) return;

    try {
      setIsEnrolling(true);
      setEnrollMessage(null);
      const res = await learningPathsApi.enrollLearningPath(pathDetail.id || slug || '');
      setPathDetail((prev) => (prev ? { ...prev, isEnrolled: true } : prev));
      setEnrollMessage(res.message || 'Enrolled successfully!');
      setTimeout(() => setEnrollMessage(null), 4000);
    } catch (err: any) {
      console.error('Enrollment failed:', err);
      alert(err.response?.data?.message || err.message || 'Failed to enroll in learning path.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) => ({
      ...prev,
      [domainId]: !prev[domainId],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-48 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs" />
            <div className="h-24 bg-white rounded-2xl border border-slate-200 shadow-xs" />
            <div className="h-64 bg-white rounded-2xl border border-slate-200 shadow-xs" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-12 text-center text-rose-700 shadow-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Roadmap Not Available</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">{error}</p>
            <Link
              to="/learning-paths"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Browse All Learning Paths
            </Link>
          </div>
        )}

        {/* Dynamic Roadmap Content */}
        {!isLoading && !error && pathDetail && (
          <div className="space-y-8">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/learning-paths" className="hover:text-indigo-600 transition-colors">
                Learning Paths
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{pathDetail.title}</span>
            </nav>

            {/* Path Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-10 shadow-sm">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase">
                      {pathDetail.career || 'Career Roadmap'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                      {pathDetail.level.replace('_', ' ')}
                    </span>
                    {pathDetail.estimatedDuration && (
                      <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {pathDetail.estimatedDuration}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Action Button: Enroll / Enrolled */}
                  <div className="flex items-center gap-3">
                    {pathDetail.isEnrolled ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Enrolled in Career Track</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all duration-200 shadow-sm shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {isEnrolling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Enrolling...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Enroll in Career Path</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {enrollMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{enrollMessage}</span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {pathDetail.title}
                </h1>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {pathDetail.description}
                </p>

                {/* Progress Bar if logged in / enrolled */}
                <div className="pt-4 border-t border-slate-100 max-w-xl">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-600">Your Path Progress</span>
                    <span className="text-indigo-600 font-bold">{pathDetail.overallProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${pathDetail.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Skills tags */}
                {Array.isArray(pathDetail.skills) && pathDetail.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {pathDetail.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600 shrink-0" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{pathDetail.totalDomains}</div>
                  <div className="text-xs text-slate-500">Total Domains</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600 shrink-0" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{pathDetail.totalTopics}</div>
                  <div className="text-xs text-slate-500">Curated Topics</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">Multi-Tutor</div>
                  <div className="text-xs text-slate-500">Independent Offerings</div>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600 shrink-0" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">Career Ready</div>
                  <div className="text-xs text-slate-500">Verified Skills</div>
                </div>
              </div>
            </div>

            {/* Domains Hierarchy Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Roadmap Curriculum</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step through domains sequentially or jump into specific topics to choose your tutor.
                  </p>
                </div>
              </div>

              {/* Empty Domains State */}
              {pathDetail.domains.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm shadow-xs">
                  <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-800">No domains configured yet</p>
                  <p className="text-xs mt-1 text-slate-500">This learning path currently has no published domain modules.</p>
                </div>
              )}

              {/* Domains Accordion List */}
              {pathDetail.domains.map((domain, domainIndex) => {
                const isExpanded = expandedDomains[domain.id];

                return (
                  <div
                    key={domain.id}
                    className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs transition-all duration-200"
                  >
                    {/* Domain Header Accordion Toggle */}
                    <button
                      onClick={() => toggleDomain(domain.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-extrabold text-sm shrink-0">
                          {domainIndex + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                              Domain {domainIndex + 1}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">
                              {domain.topicsCount} Topic{domain.topicsCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{domain.title}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {domain.progress > 0 && (
                          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{domain.progress}% Done</span>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Topics Grid inside Domain */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                        {domain.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{domain.description}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {domain.topics.map((topic) => (
                            <Link
                              key={topic.id}
                              to={`/topics/${topic.id}`}
                              className="group relative bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-[10px] font-bold text-slate-700 uppercase">
                                    {topic.difficulty}
                                  </span>

                                  {topic.userStatus?.isCompleted ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" /> Completed
                                    </span>
                                  ) : topic.userStatus?.isPurchased ? (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                      <PlayCircle className="w-3 h-3" /> Enrolled
                                    </span>
                                  ) : null}
                                </div>

                                <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {topic.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                  {topic.description}
                                </p>
                              </div>

                              {/* Footer Marketplace stats */}
                              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>
                                    {topic.tutorsCount} {topic.tutorsCount === 1 ? 'Tutor' : 'Tutors'} Available
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 font-bold text-slate-900">
                                  {topic.startingPrice != null ? (
                                    <span>
                                      Starting <span className="text-emerald-600">₹{topic.startingPrice}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">Free/Included</span>
                                  )}
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
