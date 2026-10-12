import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminSupportTicketItem } from '../../../api/admin';

interface AdminSupportTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const AdminSupportTab: React.FC<AdminSupportTabProps> = ({ onNotify }) => {
  const [tickets, setTickets] = useState<AdminSupportTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit / Resolve Modal
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getSupportTickets({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        page,
        limit: 10,
      });

      if (res.success) {
        setTickets(res.data.tickets);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching support tickets:', err);
      onNotify?.('Failed to load support tickets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, priorityFilter, page, onNotify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setIsSubmitting(true);
      const res = await adminApi.updateSupportTicket(selectedTicket.id, {
        status: newStatus || undefined,
        priority: newPriority || undefined,
      });

      if (res.success) {
        onNotify?.(res.message || 'Support ticket updated', 'success');
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update ticket';
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
            <LifeBuoy className="w-5 h-5 text-[#FA5A36]" />
            <h2 className="text-lg font-bold text-slate-900">Support & Complaints CRM</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalCount} total tickets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Learner inquiries, billing complaints, resolution SLAs, and escalation management.
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
              placeholder="Search subject, user..."
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
              aria-label="Filter tickets by status"
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Ticket ID</th>
                <th className="py-3.5 px-4">Subject & Description</th>
                <th className="py-3.5 px-4">Raised By</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA5A36] mb-2" />
                    <span>Loading support inquiries...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No tickets match the search query.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const isOpen = t.status === 'OPEN';
                  const isResolved = t.status === 'RESOLVED';
                  const isHigh = t.priority === 'HIGH' || t.priority === 'URGENT';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-[11px] font-semibold text-slate-800">
                        {t.ticketId}
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-bold text-slate-900 truncate">{t.subject}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.description}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{t.raisedBy.name}</p>
                        <p className="text-[10px] text-slate-400">{t.raisedBy.email}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isOpen
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : isOpen ? (
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-blue-600" />
                          )}
                          <span>{t.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setNewStatus(t.status);
                            setNewPriority(t.priority);
                          }}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
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

      {/* Ticket Management Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage Support Ticket</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-slate-50 p-4 rounded-2xl text-xs space-y-1.5">
              <p className="text-slate-400 font-mono text-[11px]">{selectedTicket.ticketId}</p>
              <p className="text-sm font-bold text-slate-900">{selectedTicket.subject}</p>
              <p className="text-slate-600">{selectedTicket.description}</p>
              <p className="text-slate-400 text-[11px] pt-1">
                From: {selectedTicket.raisedBy.name} ({selectedTicket.raisedBy.email})
              </p>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#FA5A36] hover:bg-[#e04825] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Update Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
