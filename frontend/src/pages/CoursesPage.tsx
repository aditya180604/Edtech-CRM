import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Star, Filter, Search, Bookmark, ArrowRight, User, BookOpen } from 'lucide-react';
import { coursesApi, type CatalogFilterItem } from '../api/courses';
import { featuredCoursesData } from '../data/mockData';
import { SyllabusModal } from '../components/SyllabusModal';
import { Link } from 'react-router-dom';
import type { Course } from '../types';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(featuredCoursesData);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<Course | null>(null);

  // Dynamically populated category & level filters from backend
  const [categoryFilters, setCategoryFilters] = useState<CatalogFilterItem[]>([
    { name: 'All', count: 6 },
    { name: 'Development', count: 2 },
    { name: 'Data Science', count: 1 },
    { name: 'Cloud Computing', count: 2 },
    { name: 'Design', count: 1 },
    { name: 'Cybersecurity', count: 1 },
  ]);

  const [levelFilters, setLevelFilters] = useState<CatalogFilterItem[]>([
    { name: 'All', count: 6 },
    { name: 'Beginner', count: 3 },
    { name: 'Intermediate', count: 2 },
    { name: 'Advanced', count: 1 },
  ]);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coursesApi.getCatalog({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        level: selectedLevel === 'All' ? undefined : selectedLevel,
        search: searchQuery.trim() || undefined,
      });

      if (res.success && res.data) {
        if (res.data.courses && res.data.courses.length > 0) {
          setCourses(res.data.courses);
        }
        if (res.data.filters) {
          if (res.data.filters.categories && res.data.filters.categories.length > 0) {
            setCategoryFilters(res.data.filters.categories);
          }
          if (res.data.filters.levels && res.data.filters.levels.length > 0) {
            setLevelFilters(res.data.filters.levels);
          }
        }
      }
    } catch (err) {
      console.warn('Using client-side filtered courses:', err);
      // Fallback local filtering
      const filtered = featuredCoursesData.filter((c) => {
        const matchCat = selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
      });
      setCourses(filtered);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedLevel, searchQuery]);

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
          <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs h-fit space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                Filters
              </span>
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
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
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
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
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
                Showing {courses.length} courses
              </span>
            </div>

            {/* Courses Card Grid (Image 5 exact card layout) */}
            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
                <p className="text-sm font-bold">No courses found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => {
                  const isBookmarked = bookmarkedIds.includes(course.id || course.slug);

                  return (
                    <Link
                      key={course.id || course.slug}
                    to={`/course/${course.slug}`}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail with Category & Bookmark */}
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                          {course.category}
                        </span>
                        <button
                          onClick={(e) => toggleBookmark(e, course.id || course.slug)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-600 hover:text-indigo-600 hover:bg-white shadow-xs transition-colors cursor-pointer"
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Course Card Body */}
                      <div className="p-4.5">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
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
                          <span className="text-xs font-semibold text-slate-600 truncate">
                            {course.instructorName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-900">
                            {typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating || 4.8}
                          </span>
                          <span>({course.reviewCount || '10K'})</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions Row */}
                    <div className="px-4 pb-4 pt-2.5 border-t border-slate-50 flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        ₹{course.price?.toLocaleString('en-IN')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedSyllabusCourse(course);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Quick View Syllabus"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Syllabus</span>
                        </button>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 flex items-center gap-0.5">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Syllabus Quick View Modal */}
      {selectedSyllabusCourse && (
        <SyllabusModal
          course={selectedSyllabusCourse}
          onClose={() => setSelectedSyllabusCourse(null)}
        />
      )}

      <Footer />
    </div>
  );
};
