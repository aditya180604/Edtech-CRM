import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Star,
  Filter,
  Search,
  ArrowRight,
  User,
  BookOpen,
  Clock,
  Sparkles,
  GraduationCap,
  Users,
  Lock,
} from 'lucide-react';
import { coursesApi, type CatalogFilterItem } from '../api/courses';
import { featuredCoursesData } from '../data/mockData';
import { SyllabusModal } from '../components/SyllabusModal';
import { Link } from 'react-router-dom';
import type { Course } from '../types';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<Course | null>(null);

  // Dynamically populated category & level filters from backend
  const [categoryFilters, setCategoryFilters] = useState<CatalogFilterItem[]>([
    { name: 'All', count: 0 },
    { name: 'Development', count: 0 },
    { name: 'Data Science', count: 0 },
    { name: 'Cloud Computing', count: 0 },
    { name: 'Design', count: 0 },
    { name: 'Cybersecurity', count: 0 },
  ]);

  const [levelFilters, setLevelFilters] = useState<CatalogFilterItem[]>([
    { name: 'All', count: 0 },
    { name: 'Beginner', count: 0 },
    { name: 'Intermediate', count: 0 },
    { name: 'Advanced', count: 0 },
  ]);

  // Debounce search query input by 300ms to eliminate excessive network latency
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coursesApi.getCatalog({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        level: selectedLevel === 'All' ? undefined : selectedLevel,
        search: debouncedSearch.trim() || undefined,
      });

      if (res.success && res.data) {
        setCourses(res.data.courses || []);
        if (res.data.filters) {
          if (res.data.filters.categories && res.data.filters.categories.length > 0) {
            setCategoryFilters(res.data.filters.categories);
          }
          if (res.data.filters.levels && res.data.filters.levels.length > 0) {
            setLevelFilters(res.data.filters.levels);
          }
        }
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.warn('Using client-side fallback courses:', err);
      const filtered = featuredCoursesData.filter((c) => {
        const matchCat = selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchSearch = c.title.toLowerCase().includes(debouncedSearch.toLowerCase());
        return matchCat && matchSearch;
      });
      setCourses(filtered);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedLevel, debouncedSearch]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Title Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Courses Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Discover comprehensive courses with hands-on projects and industry certifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =========================================================================
              LEFT SIDEBAR FILTERS (Matching Image 5)
             ========================================================================= */}
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900">Filters</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter Group (Image 5) */}
            <div>
              <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                Category
              </h3>
              <div className="space-y-2.5">
                {categoryFilters.map((cat) => (
                  <label
                    key={cat.name}
                    className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:text-indigo-600 font-semibold select-none group"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory.toLowerCase() === cat.name.toLowerCase()}
                        onChange={() => setSelectedCategory(cat.name)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                      <span className="group-hover:text-indigo-600">{cat.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter Group (Image 5) */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                Level
              </h3>
              <div className="space-y-2.5">
                {levelFilters.map((lvl) => (
                  <label
                    key={lvl.name}
                    className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:text-indigo-600 font-semibold select-none group"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="level"
                        checked={selectedLevel.toLowerCase() === lvl.name.toLowerCase()}
                        onChange={() => setSelectedLevel(lvl.name)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                      <span className="group-hover:text-indigo-600">{lvl.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COURSES GRID (Matching Image 5)
             ========================================================================= */}
          <div className="lg:col-span-9 space-y-5">
            {/* Top Search & Count Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                {loading ? 'Searching courses...' : `Showing ${courses.length} courses`}
              </span>
            </div>

            {/* Courses Card Grid (with Animated Skeleton Loader to eliminate slow feel) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse shadow-xs">
                    <div className="aspect-16/10 bg-slate-200/80 rounded-xl w-full" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="h-5 bg-slate-200 rounded w-1/4" />
                      <div className="h-5 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No courses found matching your criteria</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Try selecting "All" categories or changing your search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{course.schedule || 'Flexible Schedule'}</span>
                        </div>

                        {/* Thumbnail with Category Badge */}
                        <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black rounded-md uppercase tracking-wider">
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
                            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 bg-indigo-900/85 backdrop-blur-md text-white text-[9px] font-bold rounded-md">
                              {typeof course.remainingSeats === 'number' && course.remainingSeats <= 10
                                ? `Only ${course.remainingSeats} Seats Left!`
                                : `Limit: ${course.maxEnrollmentLimit} Seats`}
                            </span>
                          ) : null}
                        </div>

                        {/* Course Card Body */}
                        <div className="p-4.5 space-y-2.5">
                          <Link
                            to={`/course/${course.slug || course._id || course.id}`}
                            className="block hover:text-indigo-600 transition-colors"
                          >
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                              {course.title}
                            </h3>
                          </Link>

                          {/* Professional Summary Tags */}
                          {course.professionalTags && course.professionalTags.length > 0 && (
                            <div className="text-[11px] font-semibold text-slate-600 line-clamp-1">
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
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-200/50 flex items-center gap-1"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  {met}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Education & Qualifications (Optional - Omitted if empty) */}
                          {course.qualifications && course.qualifications.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              {course.qualifications.slice(0, 2).map((q, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200/50 truncate max-w-[170px]"
                                >
                                  {q}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Structural Content Badges */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Sessions</span>
                              <span className="text-xs font-black text-slate-800 truncate w-full">
                                {course.totalSessions || 24}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Duration</span>
                              <span className="text-xs font-black text-slate-800 truncate w-full">
                                {course.courseIncludes?.videoHours?.split(' ')[0] || '20+ Hrs'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Enrolled</span>
                              <span className="text-xs font-black text-slate-800 truncate w-full">
                                {course.enrolledCount ? `${course.enrolledCount}` : 'Active'}
                              </span>
                            </div>
                          </div>

                          {/* Instructor & Rating Row */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2 truncate">
                              {course.instructorAvatar ? (
                                <img
                                  src={course.instructorAvatar}
                                  alt={course.instructorName}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                                  <User className="w-3 h-3" />
                                </div>
                              )}
                              <span className="text-xs font-semibold text-slate-600 truncate">
                                {course.instructorName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-black text-slate-900">{course.rating || 4.8}</span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                ({course.reviewCount || '10K'})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Course Card Footer */}
                      <div className="px-4.5 pb-4 pt-2.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <span className="text-base font-black text-slate-900">
                            {course.price === 0 ? 'FREE' : `₹${course.price.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSyllabusCourse(course);
                            }}
                            className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer bg-white"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Syllabus</span>
                          </button>

                          {isSoldOut ? (
                            <span className="px-3 py-1.5 bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl cursor-not-allowed">
                              Course Full
                            </span>
                          ) : (
                            <Link
                              to={`/course/${course.slug || course._id || course.id}`}
                              className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-2xs"
                              title="View Course"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Syllabus Modal for Quick Inspection */}
      {selectedSyllabusCourse && (
        <SyllabusModal
          course={selectedSyllabusCourse}
          onClose={() => setSelectedSyllabusCourse(null)}
        />
      )}
    </div>
  );
};
