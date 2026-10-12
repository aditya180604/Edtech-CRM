import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminInstructorItem } from '../../../api/admin';

interface AdminInstructorsTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const AdminInstructorsTab: React.FC<AdminInstructorsTabProps> = ({ onNotify }) => {
  const [instructors, setInstructors] = useState<AdminInstructorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status Action Modal
  const [selectedInstructor, setSelectedInstructor] = useState<AdminInstructorItem | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'ACTIVATE' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Details Modal
  const [inspectInstructor, setInspectInstructor] = useState<AdminInstructorItem | null>(null);

  const fetchInstructors = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getInstructors({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });

      if (res.success) {
        setInstructors(res.data.instructors);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching instructors:', err);
      onNotify?.('Failed to load instructors directory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, onNotify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstructors();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInstructors]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstructor || !actionType) return;

    try {
      setIsSubmitting(false);
      const newStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
      const res = await adminApi.updateInstructorStatus(selectedInstructor.id, newStatus, reason);

      if (res.success) {
        onNotify?.(res.message || `Instructor marked as ${newStatus}`, 'success');
        setSelectedInstructor(null);
        setActionType(null);
        setReason('');
        fetchInstructors();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update instructor status';
      onNotify?.(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-bold">Super Admin Verification Governance:</span> Initial instructor approval, KYC verification, and payout authorization are reserved exclusively for the Super Admin. Operational Admins manage directory standing, active/suspended status, and curriculum oversight.
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#FA5A36]" />
            <h2 className="text-lg font-bold text-slate-900">Instructors & Mentors</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalCount} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Faculty directory, expertise disciplines, and active teaching statuses.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by instructor name, title, email..."
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
              aria-label="Filter instructors by status"
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>

          <button
            onClick={fetchInstructors}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Instructors Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Instructor</th>
                <th className="py-3.5 px-4">Expertise & Disciplines</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Published Courses</th>
                <th className="py-3.5 px-4">Joined On</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && instructors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA5A36] mb-2" />
                    <span>Loading instructors from MongoDB...</span>
                  </td>
                </tr>
              ) : instructors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No instructors match the search or filter query.
                  </td>
                </tr>
              ) : (
                instructors.map((inst) => {
                  const isActive = inst.status === 'ACTIVE';
                  const isVerified = inst.isVerified;

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Title */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {inst.name?.[0]?.toUpperCase() || 'I'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-[#FA5A36] transition-colors">
                              {inst.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{inst.title || inst.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Expertise */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {inst.expertise && inst.expertise.length > 0 ? (
                            inst.expertise.slice(0, 2).map((exp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium"
                              >
                                {exp}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">General Faculty</span>
                          )}
                          {inst.expertise && inst.expertise.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-semibold self-center">
                              +{inst.expertise.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{inst.verificationStatus || 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* Courses */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                          <span>{inst.coursesCount} courses</span>
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(inst.registeredOn).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{inst.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectInstructor(inst)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Details
                          </button>

                          {isActive ? (
                            <button
                              onClick={() => {
                                setSelectedInstructor(inst);
                                setActionType('SUSPEND');
                              }}
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedInstructor(inst);
                                setActionType('ACTIVATE');
                              }}
                              className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
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

      {/* Status Action Confirmation Modal */}
      {selectedInstructor && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'SUSPEND' ? 'Suspend Faculty Account' : 'Reactivate Faculty Account'}
              </h3>
              <button
                onClick={() => {
                  setSelectedInstructor(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              You are about to {actionType === 'SUSPEND' ? 'suspend' : 'reactivate'} the teaching privileges of{' '}
              <strong className="text-slate-900">{selectedInstructor.name}</strong> ({selectedInstructor.email}).
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Action (Recorded in Audit Log)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Conduct review, course audit, or temporary moderation..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FA5A36] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInstructor(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                    actionType === 'SUSPEND'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? 'Updating...' : `Confirm ${actionType === 'SUSPEND' ? 'Suspension' : 'Activation'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Instructor Modal */}
      {inspectInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Instructor Dossier</h3>
              <button
                onClick={() => setInspectInstructor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-bold text-base flex items-center justify-center">
                  {inspectInstructor.name?.[0] || 'I'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{inspectInstructor.name}</h4>
                  <p className="text-slate-600">{inspectInstructor.title || 'Faculty Member'}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{inspectInstructor.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Total Courses</p>
                  <p className="text-base font-bold text-slate-900 mt-1">{inspectInstructor.coursesCount}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Verification Status</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {inspectInstructor.isVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
              </div>

              {inspectInstructor.expertise && inspectInstructor.expertise.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectInstructor.expertise.map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectInstructor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
