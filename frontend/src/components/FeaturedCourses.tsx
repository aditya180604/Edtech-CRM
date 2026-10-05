import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  ArrowRight,
  User,
  BookOpen,
  Clock,
  Sparkles,
  GraduationCap,
  Users,
  Lock,
} from 'lucide-react';
import { coursesApi } from '../api/courses';
import { SyllabusModal } from './SyllabusModal';
import type { Course } from '../types';

export const FeaturedCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<Course | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadFeatured = async () => {
      try {
        setLoading(true);
        const res = await coursesApi.getFeatured(8);
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setCourses(res.data);
        }
      } catch (err) {
        console.warn('Failed to load featured courses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Featured Courses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Top-rated courses handpicked by industry professionals
          </p>
        </div>
        <Link
          to="/courses"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeleton State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="aspect-16/10 w-full bg-slate-200" />
                <div className="p-4.5 space-y-3">
                  <div className="h-3 bg-indigo-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-5/6" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-5 h-5 rounded-full bg-slate-200" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="px-4 pb-4 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-7 bg-slate-100 rounded-lg w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-md mx-auto space-y-2 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Featured Courses Available</h3>
          <p className="text-xs text-slate-500">Check back shortly or explore the full course catalog.</p>
          <Link
            to="/courses"
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Browse All Courses
          </Link>
        </div>
      ) : (
        /* Courses Grid - Image 1 Spec */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course) => {
            const courseId = course.id || course.slug || course._id || '';
            const isBookmarked = bookmarkedIds.includes(courseId);
            const isWishlisted = wishlistIds.includes(courseId);
            const isSoldOut = Boolean(course.isSoldOut);

            return (
              <div
                key={courseId}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Schedule & Deadline */}
                  <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{course.schedule || 'Flexible Schedule'}</span>
                  </div>

                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                    <img
                      src={
                        course.thumbnail ||
                        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Category Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-black rounded-md uppercase tracking-wider">
                        {course.category}
                      </span>
                    </div>

                    {/* Sold Out Badge or Remaining Seats */}
                    {isSoldOut ? (
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 bg-rose-600/95 backdrop-blur-md text-white text-[10px] font-black rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Sold Out
                      </span>
                    ) : course.maxEnrollmentLimit ? (
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-indigo-900/85 backdrop-blur-md text-white text-[9px] font-bold rounded-md">
                        {typeof course.remainingSeats === 'number' && course.remainingSeats <= 10
                          ? `Only ${course.remainingSeats} Seats Left!`
                          : `Limit: ${course.maxEnrollmentLimit} Seats`}
                      </span>
                    ) : null}
                  </div>

                  {/* Course Body */}
                  <div className="p-4 space-y-2.5">
                    <Link
                      to={`/course/${course.slug || course._id || course.id}`}
                      className="block hover:text-indigo-600 transition-colors"
                    >
                      <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {course.title}
                      </h3>
                    </Link>

                    {/* Professional Summary Tags */}
                    {course.professionalTags && course.professionalTags.length > 0 && (
                      <div className="text-[10px] font-semibold text-slate-600 line-clamp-1">
                        {course.professionalTags.map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center">
                            <span>{tag}</span>
                            {idx < (course.professionalTags?.length || 0) - 1 && (
                              <span className="mx-1 text-slate-300">|</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Experience & Achievement Metrics */}
                    {course.experienceMetrics && course.experienceMetrics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {course.experienceMetrics.slice(0, 3).map((met, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-black rounded border border-emerald-200/50 flex items-center gap-0.5"
                          >
                            <Sparkles className="w-2 h-2 text-emerald-600" />
                            {met}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Education & Qualifications (Optional - Omitted if empty) */}
                    {course.qualifications && course.qualifications.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <GraduationCap className="w-3 h-3 text-purple-600 shrink-0" />
                        {course.qualifications.slice(0, 2).map((q, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-purple-50 text-purple-800 text-[9px] font-bold rounded border border-purple-200/50 truncate max-w-[150px]"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Structural Content Badges */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                      <div className="p-1 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Sessions</span>
                        <span className="text-[10px] font-extrabold text-slate-800 truncate w-full">
                          {course.totalSessions || 24}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Duration</span>
                        <span className="text-[10px] font-extrabold text-slate-800 truncate w-full">
                          {course.courseIncludes?.videoHours?.split(' ')[0] || '20+ Hrs'}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Enrolled</span>
                        <span className="text-[10px] font-extrabold text-slate-800 truncate w-full">
                          {course.enrolledCount ? `${course.enrolledCount}` : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Instructor & Rating Row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {course.instructorAvatar ? (
                          <img
                            src={course.instructorAvatar}
                            alt={course.instructorName}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-slate-600 truncate">
                          {course.instructorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-slate-900">
                          {typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating || '4.8'}
                        </span>
                        <span className="text-[10px] text-slate-400">({course.reviewCount || '10K'})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Action Row */}
                <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                  <div className="flex items-baseline">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {course.price === 0 ? 'FREE' : `₹${course.price?.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedSyllabusCourse(course);
                      }}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Quick View Syllabus"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Syllabus</span>
                    </button>

                    {isSoldOut ? (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded-lg cursor-not-allowed">
                        Course Full
                      </span>
                    ) : (
                      <Link
                        to={`/course/${course.slug || course._id || course.id}`}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Syllabus Modal */}
      {selectedSyllabusCourse && (
        <SyllabusModal
          course={selectedSyllabusCourse}
          onClose={() => setSelectedSyllabusCourse(null)}
        />
      )}
    </section>
  );
};
