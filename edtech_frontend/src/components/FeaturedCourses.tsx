import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, ArrowRight, User, BookOpen, AlertCircle } from 'lucide-react';
import { catalogApi, type CatalogCourse } from '../api/catalog';


export const FeaturedCourses: React.FC = () => {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getCourses({ limit: 8 })
      .then((data) => {
        setCourses(data.courses || []);
      })
      .catch((err) => {
        console.error('Failed to load featured courses:', err);
        setError('Unable to load featured courses.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds((prev) =>
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
      {!isLoading && !error && courses.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No featured courses available</h3>
          <p className="text-xs text-slate-500">Check back soon for new course releases.</p>
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {courses.map((course) => {
            const isBookmarked = bookmarkedIds.includes(course.id);

            return (
              <Link
                key={course.id}
                to={`/course/${course.slug || course.id}`}
                className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail & Bookmark Button */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 text-white p-4 text-center">
                        <span className="text-2xl font-black tracking-wider mb-1">
                          {course.title
                            .split(' ')
                            .map((w) => w[0])
                            .filter(Boolean)
                            .slice(0, 3)
                            .join('')}
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-200 line-clamp-1">
                          {course.title}
                        </span>
                      </div>
                    )}

                    {course.badge && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-md uppercase">
                        {course.badge}
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleBookmark(e, course.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-600 hover:text-indigo-600 hover:bg-white shadow-xs transition-colors cursor-pointer"
                      title={isBookmarked ? 'Remove Bookmark' : 'Save Course'}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Course Body */}
                  <div className="p-4.5">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1 block">
                      {course.category}
                    </span>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2.5">
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-2.5">
                      {course.instructorAvatar ? (
                        <img
                          src={course.instructorAvatar}
                          alt={course.instructorName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                          <User className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-600 truncate">
                        {course.instructorName}
                      </span>
                    </div>

                    {course.rating > 0 ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900">{course.rating.toFixed(1)}</span>
                        <span>({course.reviewCount})</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium">
                        {course.studentCount ? `${course.studentCount} enrolled` : 'Newly Added'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="px-4.5 pb-4.5 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{course.price.toLocaleString('en-IN')}
                    </span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{course.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-indigo-600 group-hover:underline">
                    View Course
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
