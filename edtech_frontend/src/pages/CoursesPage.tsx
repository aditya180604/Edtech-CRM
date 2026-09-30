import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Star, Filter, Search, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi, type CatalogCourse, type CatalogCategory } from '../api/catalog';


export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [coursesRes, catRes] = await Promise.all([
        catalogApi.getCourses({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          level: selectedLevel !== 'All' ? selectedLevel : undefined,
          search: searchQuery.trim() || undefined,
        }),
        catalogApi.getCategories().catch(() => []),
      ]);

      setCourses(coursesRes.courses || []);
      if (catRes && catRes.length > 0) {
        setCategories(catRes);
      }
    } catch (err: any) {
      console.error('Failed to load catalog courses:', err);
      setError('Unable to load courses from the catalog. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedLevel, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            All Courses
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Explore complete learning journeys designed by industry experts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                Filters
              </span>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedLevel('All');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Category
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer hover:text-indigo-600">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'All'}
                    onChange={() => setSelectedCategory('All')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat.name}
                    className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer hover:text-indigo-600"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.name}
                      onChange={() => setSelectedCategory(cat.name)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{cat.name} ({cat.coursesCountNumber})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Level
              </h3>
              <div className="space-y-2">
                {levels.map((lvl) => (
                  <label
                    key={lvl}
                    className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer hover:text-indigo-600"
                  >
                    <input
                      type="radio"
                      name="level"
                      checked={selectedLevel === lvl}
                      onChange={() => setSelectedLevel(lvl)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{lvl}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Courses Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search & Sort header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 bg-slate-50 text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {isLoading ? 'Searching...' : `Showing ${courses.length} courses`}
              </span>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-4">
                    <div className="aspect-16/10 bg-slate-200 rounded-xl w-full" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-6 bg-slate-100 rounded w-1/3 pt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-rose-900">Failed to load courses</h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
                <button
                  onClick={loadData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Connection
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && courses.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No courses found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no published courses matching your selected filter or search criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedLevel('All');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* Courses List */}
            {!isLoading && !error && courses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.slug || course.id}`}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
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

                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold rounded-lg uppercase">
                          {course.category}
                        </span>
                        {course.badge && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-extrabold rounded-md uppercase">
                            {course.badge}
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">{course.instructorName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-900">{course.rating}</span>
                          <span>({course.reviewCount})</span>
                          <span className="mx-1">•</span>
                          <span>{course.totalTopics} topics</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-slate-900">
                          ₹{course.price.toLocaleString('en-IN')}
                        </span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{course.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                        View Course
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
