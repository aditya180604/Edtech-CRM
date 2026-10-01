import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  CreditCard,
  Check,
  Video,
} from 'lucide-react';
import {
  learningPathsApi,
  type OfferingDetailResponse,
  type OfferingLesson,
  type LessonContentResponse,
} from '../api/learningPaths';

export const OfferingDetailPage: React.FC = () => {
  const { offeringId } = useParams<{ offeringId: string }>();
  const [offering, setOffering] = useState<OfferingDetailResponse | null>(null);
  const [activeLesson, setActiveLesson] = useState<OfferingLesson | null>(null);
  const [, setLessonContent] = useState<LessonContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (offeringId) {
      fetchOffering(offeringId);
    }
  }, [offeringId]);

  const fetchOffering = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await learningPathsApi.getOfferingDetail(id);
      setOffering(data);

      if (data.curriculum && data.curriculum.length > 0) {
        // Pick first accessible or first lesson
        const firstAccessible = data.curriculum.find((l) => l.hasAccess) || data.curriculum[0];
        setActiveLesson(firstAccessible);
        if (firstAccessible.hasAccess) {
          loadLessonContent(data.id, firstAccessible.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load offering:', err);
      setError('Unable to load tutor offering details.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessonContent = async (offId: string, lesId: string) => {
    try {
      const content = await learningPathsApi.getOfferingLessonContent(offId, lesId);
      setLessonContent(content);
    } catch (err: any) {
      console.warn('Lesson locked or unauthorized:', err.message);
      setLessonContent(null);
    }
  };

  const handleSelectLesson = (lesson: OfferingLesson) => {
    setActiveLesson(lesson);
    if (offering && lesson.hasAccess) {
      loadLessonContent(offering.id, lesson.id);
    } else {
      setLessonContent(null);
    }
  };

  const handlePurchase = async () => {
    if (!offering) return;
    try {
      setIsPurchasing(true);
      setError(null);
      const res = await learningPathsApi.purchaseOffering(offering.id);
      setSuccessMessage(res.message || 'Enrollment successful! You now have full access.');
      // Refresh offering state to unlock curriculum
      await fetchOffering(offering.id);
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to complete offering purchase.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleToggleComplete = async (lesson: OfferingLesson) => {
    if (!offering || !lesson.hasAccess) return;
    try {
      await learningPathsApi.updateOfferingProgress(offering.id, {
        lessonId: lesson.id,
        watchedSeconds: lesson.duration || 600,
        totalSeconds: lesson.duration || 600,
        completed: !lesson.isCompleted,
      });
      // Refresh curriculum progress
      await fetchOffering(offering.id);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-slate-900/60 rounded-3xl border border-slate-800 p-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-96 bg-slate-900/40 rounded-3xl border border-slate-800" />
              <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-3xl p-8 mb-6 text-center text-rose-300">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Success Message Banner */}
        {successMessage && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 mb-6 flex items-center justify-between text-emerald-300 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Offering Details & Classroom Experience */}
        {!isLoading && offering && (
          <div className="space-y-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/learning-paths" className="hover:text-indigo-400 transition-colors">
                Learning Paths
              </Link>
              <span>/</span>
              {offering.topic && (
                <>
                  <Link to={`/topics/${offering.topic.id}`} className="hover:text-indigo-400 transition-colors">
                    {offering.topic.title}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-slate-200 font-semibold">{offering.title}</span>
            </nav>

            {/* Top Offering Header Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-purple-950/90 border border-indigo-500/20 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wide">
                      Tutor Offering
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold">
                      {offering.level.replace('_', ' ')}
                    </span>
                    {offering.isEntitled && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled & Entitled
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {offering.title}
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {offering.description}
                  </p>

                  {/* Instructor Bio Bar */}
                  <div className="flex items-center gap-3.5 pt-3 border-t border-slate-800/80">
                    {offering.instructor.avatar ? (
                      <img
                        src={offering.instructor.avatar}
                        alt={offering.instructor.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/40"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-base">
                        {offering.instructor.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {offering.instructor.name}
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-xs text-slate-400">
                        {offering.instructor.title || 'Senior Engineering Instructor'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Purchase Action Card */}
                <div className="lg:w-80 bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl shrink-0">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Authoritative Price
                    </span>
                    <div className="text-3xl font-extrabold text-white">
                      ₹{offering.price}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Unlocks full curriculum, downloadable materials & tutor updates.
                    </p>
                  </div>

                  {offering.isEntitled ? (
                    <div className="w-full py-3 px-4 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>You own this offering</span>
                    </div>
                  ) : (
                    <button
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isPurchasing ? 'Processing Order...' : `Enroll Now — ₹${offering.price}`}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Interactive Classroom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Video / Lesson Player Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Player Box */}
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 shadow-2xl">
                  {activeLesson?.hasAccess ? (
                    <div className="text-center space-y-4 max-w-md">
                      <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                        <Video className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                          {activeLesson.isFreePreview && !offering.isEntitled ? 'Free Preview Lesson' : 'Secure Stream Authorized'}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{activeLesson.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">Duration: {activeLesson.durationDisplay}</p>
                      </div>

                      {/* Complete toggle button */}
                      <button
                        onClick={() => handleToggleComplete(activeLesson)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer ${
                          activeLesson.isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{activeLesson.isCompleted ? 'Completed' : 'Mark as Complete'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 max-w-sm p-6">
                      <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-white">Lesson Locked</h3>
                      <p className="text-xs text-slate-400">
                        This lesson requires an active enrollment for {offering.instructor.name}'s offering.
                      </p>
                      <button
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer"
                      >
                        Unlock Offering for ₹{offering.price}
                      </button>
                    </div>
                  )}
                </div>

                {/* Lesson Description & Objectives */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">What You'll Learn in this Offering</h3>
                    {Array.isArray(offering.learningObjectives) && offering.learningObjectives.length > 0 ? (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                        {offering.learningObjectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">Comprehensive hands-on training with real-world case studies.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Curriculum Lesson List */}
              <div className="space-y-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-base font-bold text-white">Curriculum</h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {offering.progress.completedLessons} / {offering.totalLessons} Done
                    </span>
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {offering.curriculum.map((lesson) => {
                      const isSelected = activeLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleSelectLesson(lesson)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500/60 shadow-md'
                              : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0">
                              {lesson.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : lesson.hasAccess ? (
                                <PlayCircle className="w-5 h-5 text-indigo-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{lesson.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{lesson.durationDisplay}</span>
                                {lesson.isFreePreview && !offering.isEntitled && (
                                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
