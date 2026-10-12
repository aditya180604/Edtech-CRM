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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 bg-white rounded-3xl border border-slate-200 p-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 bg-white rounded-3xl border border-slate-200" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-12 text-center text-rose-800">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Topic Not Found</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">{error}</p>
            <Link
              to="/learning-paths"
              className="px-6 py-2.5 bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#FA5A36]/25"
            >
              Back to Learning Paths
            </Link>
          </div>
        )}

        {/* Topic & Offerings Marketplace Content */}
        {!isLoading && !error && topicDetail && (
          <div className="space-y-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/learning-paths" className="hover:text-[#FA5A36] transition-colors">
                Learning Paths
              </Link>
              <span>/</span>
              {topicDetail.course && (
                <>
                  <Link to={`/courses/${topicDetail.course.slug}`} className="hover:text-[#FA5A36] transition-colors">
                    {topicDetail.course.title}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-slate-900 font-semibold">{topicDetail.title}</span>
            </nav>

            {/* Canonical Topic Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-10 shadow-xs">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-bold uppercase tracking-wider">
                    Canonical Subject
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                    {topicDetail.difficulty}
                  </span>
                  {topicDetail.module && (
                    <span className="text-xs text-slate-500 font-medium">
                      Module: <span className="text-slate-800 font-semibold">{topicDetail.module.title}</span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {topicDetail.title}
                </h1>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {topicDetail.description}
                </p>

                {/* Skills tags */}
                {Array.isArray(topicDetail.skills) && topicDetail.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {topicDetail.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200"
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
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Users className="w-6 h-6 text-[#FA5A36]" />
                    <span>Available Tutor Offerings</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2]">
                      {topicDetail.offeringsCount} {topicDetail.offeringsCount === 1 ? 'Tutor' : 'Tutors'}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                    Select a tutor content offering tailored to your learning style. Each offering is an independent
                    packaged course.
                  </p>
                </div>
              </div>
            </div>

            {/* Empty Offerings State */}
            {topicDetail.offerings.length === 0 && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-xs">
                <Users className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Tutor Offerings Published Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                    className={`group relative bg-white border rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xs ${
                      offering.isPurchased
                        ? 'border-emerald-300 shadow-sm'
                        : 'border-slate-200/80 hover:border-[#FFCCC2] hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Tutor Profile Header */}
                      <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-100">
                        {offering.instructor.avatar ? (
                          <img
                            src={offering.instructor.avatar}
                            alt={offering.instructor.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-base">
                            {offering.instructor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {offering.instructor.name}
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {offering.instructor.headline || 'Senior Engineering Instructor'}
                          </div>
                        </div>
                      </div>

                      {/* Offering Title & Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                            {offering.level}
                          </span>
                          {offering.isPurchased && (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Enrolled
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#FA5A36] transition-colors line-clamp-2">
                          {offering.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {offering.description}
                        </p>
                      </div>

                      {/* Curriculum Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#FA5A36]" />
                          <span>{offering.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{offering.totalLessons} Lessons</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA Button */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Tutor Price</div>
                        <div className="text-xl font-extrabold text-slate-900">
                          ₹{offering.price}
                        </div>
                      </div>

                      <Link
                        to={`/offerings/${offering.id}`}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          offering.isPurchased
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-[#FA5A36] hover:bg-[#E04322] text-white shadow-md shadow-[#FA5A36]/25'
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
