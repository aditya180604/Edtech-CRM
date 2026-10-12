import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminCourseItem } from '../../../api/admin';

interface AdminCoursesTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const AdminCoursesTab: React.FC<AdminCoursesTabProps> = ({ onNotify }) => {
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status Toggle Modal
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getCourses({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        page,
        limit: 10,
      });

      if (res.success) {
        setCourses(res.data.courses);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      onNotify?.('Failed to load courses catalog', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page, onNotify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const handleToggleStatus = async () => {
    if (!selectedCourse) return;

    try {
      setIsSubmitting(true);
      const newStatus = selectedCourse.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      const res = await adminApi.updateCourseStatus(selectedCourse.id, newStatus);

      if (res.success) {
        onNotify?.(res.message || `Course status changed to ${newStatus}`, 'success');
        setSelectedCourse(null);
        fetchCourses();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update course status';
      onNotify?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FA5A36]" />
            <h2 className="text-lg font-bold text-slate-900">Curriculum & Courses</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalCount} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publication lifecycle, pricing tiers, and active student enrollment counts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search course title..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-[#FA5A36] focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter courses by status"
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <button
            onClick={fetchCourses}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Courses Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Course Information</th>
                <th className="py-3.5 px-4">Instructor</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Tuition Price</th>
                <th className="py-3.5 px-4">Enrolled Students</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA5A36] mb-2" />
                    <span>Loading courses catalog...</span>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No courses match the search and filtering criteria.
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const isPublished = course.status === 'PUBLISHED';

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Course Info */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 rounded-lg bg-orange-50 text-[#FA5A36] flex items-center justify-center font-bold text-xs shrink-0 border border-orange-100">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="font-bold text-slate-900 group-hover:text-[#FA5A36] transition-colors truncate">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              /{course.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Instructor */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{course.instructor.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{course.instructor.email}</p>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{course.category || 'General'}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-[10px] text-slate-400">{course.currency}</p>
                      </td>

                      {/* Enrollments */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px]">
                          <Users className="w-3.5 h-3.5" />
                          <span>{course.enrollments} learners</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPublished ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{course.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/course/${course.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Preview Public Course Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => setSelectedCourse(course)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isPublished
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-800">{page}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} total)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Course Status Toggle Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {selectedCourse.status === 'PUBLISHED' ? 'Unpublish Course' : 'Publish Course'}
              </h3>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Are you sure you want to {selectedCourse.status === 'PUBLISHED' ? 'unpublish' : 'publish'}{' '}
              <strong className="text-slate-900">"{selectedCourse.title}"</strong>?
              {selectedCourse.status === 'PUBLISHED'
                ? ' It will be converted to Draft status and hidden from the public marketplace.'
                : ' It will become immediately visible in the student course catalog.'}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                  selectedCourse.status === 'PUBLISHED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? 'Updating...' : `Confirm ${selectedCourse.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
