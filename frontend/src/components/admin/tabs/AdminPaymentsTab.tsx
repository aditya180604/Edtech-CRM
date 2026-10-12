import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminPaymentItem } from '../../../api/admin';

interface AdminPaymentsTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({ onNotify }) => {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentItem | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPayments({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });

      if (res.success) {
        setPayments(res.data.payments);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      onNotify?.('Failed to load transaction ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, onNotify]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#FA5A36]" />
            <h2 className="text-lg font-bold text-slate-900">Payments & Purchases</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalCount} transactions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled Cashfree payment events, order references, and receipt states.
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
              placeholder="Search order ID, student email..."
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
              aria-label="Filter transactions by payment status"
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <button
            onClick={fetchPayments}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payments Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Order Reference</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Item / Course</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Gateway Reference</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA5A36] mb-2" />
                    <span>Loading payment transactions...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isSuccess = p.status === 'SUCCESS' || p.status === 'PAID';
                  const isPending = p.status === 'PENDING' || p.status === 'PROCESSING';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order Reference */}
                      <td className="py-3.5 px-6 font-mono text-[11px] font-semibold text-slate-800">
                        {p.orderId}
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{p.student.name}</p>
                        <p className="text-[11px] text-slate-400">{p.student.email}</p>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-800">
                        {p.course}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{p.amount.toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">{p.currency}</span>
                      </td>

                      {/* Gateway Reference */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                        {p.cashfreeReference || 'CF_DIRECT'}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(p.date).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Status & Action */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : isPending ? (
                              <Clock className="w-3 h-3 text-amber-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{p.status}</span>
                          </span>

                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Details
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

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#FA5A36]" />
                <h3 className="text-base font-bold text-slate-900">Payment Transaction Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Gross Amount</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    ₹{selectedPayment.amount.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-500">{selectedPayment.currency}</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedPayment.status === 'SUCCESS' || selectedPayment.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedPayment.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Order ID</p>
                  <p className="font-mono font-bold text-slate-900 mt-1 truncate">{selectedPayment.orderId}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Cashfree Reference</p>
                  <p className="font-mono font-medium text-slate-700 mt-1 truncate">
                    {selectedPayment.cashfreeReference || 'CF_DIRECT'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Customer (Student)</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedPayment.student.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{selectedPayment.student.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">Payment Method</p>
                  <p className="font-semibold text-slate-800 mt-1">{selectedPayment.paymentMethod || 'Online Gateway'}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-400 text-[10px] font-semibold uppercase">Purchased Item / Course</p>
                <p className="font-bold text-slate-900 mt-1">{selectedPayment.course}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Transaction Timestamp</span>
                <span className="font-medium text-slate-700">
                  {new Date(selectedPayment.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
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
