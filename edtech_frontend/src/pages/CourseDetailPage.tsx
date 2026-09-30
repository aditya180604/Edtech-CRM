import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Star,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Layers,
  AlertCircle,
  Video,
  ChevronDown,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { catalogApi, type CatalogCourseDetail } from '../api/catalog';


export const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CatalogCourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);

    catalogApi
      .getCourseBySlug(slug)
      .then((data) => {
        if (!data) {
          setError('Course not found in catalog');
        } else {
          setCourse(data);
          // Expand first module by default
          if (data.curriculum && data.curriculum.length > 0) {
            setExpandedModules({ [data.curriculum[0].moduleId]: true });
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching course detail:', err);
        setError('Unable to load course details. Please check your connection.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8 animate-pulse">
            <div className="bg-slate-900 rounded-3xl p-12 h-64 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-2xl h-48" />
                <div className="bg-white p-6 rounded-2xl h-64" />
              </div>
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl h-80" />
            </div>
          </div>
        )}

        {/* Error / Not Found State */}
        {!isLoading && (error || !course) && (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center max-w-xl mx-auto space-y-4 my-12 shadow-sm">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Course Not Found</h1>
            <p className="text-sm text-slate-500">
              {error || 'The requested course does not exist in the database or is not published.'}
            </p>
            <div className="pt-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20"
              >
                <BookOpen className="w-4 h-4" />
                Browse Available Courses
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic Course Content */}
        {!isLoading && course && (
          <>
            {/* Course Banner */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-10 relative overflow-hidden">
              <div className="max-w-3xl relative z-10">
                <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider mb-4 inline-block">
                  {course.category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
                  {course.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
                  {course.description || course.shortDescription || ''}
                </p>
                <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300">
                  {course.rating > 0 && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="font-bold text-white">{course.rating}</span>
                      <span>({course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}
                  {course.instructor?.name && (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <span>Instructor: <strong className="text-white">{course.instructor.name}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>{course.totalModules} modules • {course.totalTopics} topics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content & Pricing Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left info */}
              <div className="lg:col-span-8 space-y-8">
                {/* Learning Objectives (Only rendered if present in MongoDB) */}
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">What you'll learn</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {course.learningObjectives.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Course Curriculum */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Course Curriculum</h2>
                    <span className="text-xs font-semibold text-slate-500">
                      {course.totalModules} Modules • {course.totalLessons} Lessons
                    </span>
                  </div>

                  {course.curriculum && course.curriculum.length > 0 ? (
                    <div className="space-y-3">
                      {course.curriculum.map((mod, idx) => {
                        const isExpanded = !!expandedModules[mod.moduleId];
                        return (
                          <div key={mod.moduleId} className="border border-slate-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => toggleModule(mod.moduleId)}
                              className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition"
                            >
                              <div className="flex items-center gap-2.5">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="text-sm font-bold text-slate-900">
                                  Module {idx + 1}: {mod.title}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-slate-500">
                                {mod.topics?.length || 0} topics
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="p-4 space-y-3 bg-white divide-y divide-slate-100">
                                {mod.topics?.map((topic) => (
                                  <div key={topic.topicId} className="pt-2.5 first:pt-0 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-800">
                                        📌 {topic.title}
                                      </span>
                                      <span className="text-xs font-semibold text-indigo-600">
                                        ₹{topic.price}
                                      </span>
                                    </div>
                                    {topic.lessons?.map((lesson) => (
                                      <div
                                        key={lesson.lessonId}
                                        className="pl-4 flex items-center justify-between text-xs text-slate-600"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <Video className="w-3 h-3 text-slate-400" />
                                          {lesson.title}
                                        </span>
                                        {lesson.isFreePreview && (
                                          <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                                            Preview
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Detailed syllabus topics are being synchronized from MongoDB.
                    </p>
                  )}
                </div>

                {/* Instructor Profile */}
                {course.instructor && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-4">
                    {course.instructor.avatar ? (
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg">
                        {course.instructor.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">{course.instructor.name}</h3>
                      <p className="text-xs font-semibold text-indigo-600">{course.instructor.title}</p>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">{course.instructor.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right sticky pricing card */}
              <div className="lg:col-span-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24 space-y-5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ₹{course.price.toLocaleString('en-IN')}
                    </span>
                    {course.price > 0 && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{Math.round(course.price * 1.5).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Link
                      to="/cart"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Enroll in Full Course</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/topics"
                      className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center"
                    >
                      Buy Individual Topics
                    </Link>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Full lifetime access
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Access on all devices
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Industry Certificate of completion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};
