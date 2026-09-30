import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Star, Filter, Search } from 'lucide-react';
import { featuredCoursesData } from '../data/mockData';
import { Link } from 'react-router-dom';

export const CoursesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Development', 'Data Science', 'Cloud Computing', 'Design', 'Cybersecurity'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = featuredCoursesData.filter((c) => {
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer hover:text-indigo-600"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{cat}</span>
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
                Showing {filteredCourses.length} courses
              </span>
            </div>

            {/* Courses List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/course/${course.slug}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold rounded-lg uppercase">
                        {course.category}
                      </span>
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
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{course.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                      View Course
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
