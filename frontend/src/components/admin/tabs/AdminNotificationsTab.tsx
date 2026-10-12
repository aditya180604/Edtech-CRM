import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminNotificationItem } from '../../../api/admin';

interface AdminNotificationsTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({ onNotify }) => {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getNotifications({ page, limit: 12 });
      if (res.success) {
        setNotifications(res.data.notifications);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      onNotify?.('Failed to load dispatch history', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, onNotify]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#FA5A36]" />
            <h2 className="text-lg font-bold text-slate-900">System Notification Logs</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalCount} total alerts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of platform dispatch events, enrollment emails, and user alerts.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          title="Refresh Notifications"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
        </button>
      </div>

      {/* Notifications Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading && notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA5A36] mb-2" />
            <span>Retrieving notification logs...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No system notifications dispatched yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FA5A36] flex items-center justify-center shrink-0 mt-0.5 border border-orange-100">
                  <Mail className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{n.message}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      To: {n.recipientName} ({n.recipient})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold uppercase">
                      {n.type}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                        n.status === 'SENT' || n.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{n.status}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
    </div>
  );
};
