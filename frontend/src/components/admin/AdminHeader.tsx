import React, { useState } from 'react';
import {
  Menu,
  Search,
  Calendar,
  Bell,
  CheckCircle2,
  Database,
  RefreshCw,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { AdminTab } from './AdminSidebar';
import { adminApi } from '../../api/admin';
import type { AdminNotificationItem } from '../../api/admin';
import { Mail, ExternalLink } from 'lucide-react';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  user: any;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  onNavigateTab?: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isLoading = false,
  user,
  onLogout,
  unreadNotificationsCount = 0,
  onNavigateTab,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<AdminNotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchRecentNotifs = async () => {
    try {
      setLoadingNotifs(true);
      const res = await adminApi.getNotifications({ page: 1, limit: 4 });
      if (res.success) {
        setRecentNotifications(res.data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to fetch recent notifications', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      fetchRecentNotifs();
    }
    setShowNotifications(!showNotifications);
  };

  const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Platform Overview',
      subtitle: 'Real-time metrics, platform growth, and operational health',
    },
    students: {
      title: 'Student Directory',
      subtitle: 'Manage enrolled learners, verification status, and activity',
    },
    instructors: {
      title: 'Instructors Management',
      subtitle: 'Active faculty directory, routine moderation, and profiles',
    },
    courses: {
      title: 'Course Catalog',
      subtitle: 'Course publication states, curriculum management, and enrollments',
    },
    payments: {
      title: 'Payments & Revenue',
      subtitle: 'Cashfree transaction ledger, orders, and revenue reconciliations',
    },
    consultations: {
      title: 'Mentorship Consultations',
      subtitle: '1-on-1 expert sessions, schedule bookings, and meeting statuses',
    },
    support: {
      title: 'Support & CRM Tickets',
      subtitle: 'Learner complaints, inquiries, resolution tracking, and SLAs',
    },
    reports: {
      title: 'Platform Analytics & Reports',
      subtitle: 'Revenue breakdown, enrollment growth, and category performance',
    },
    notifications: {
      title: 'System Notifications',
      subtitle: 'Audit trail of platform dispatch logs, alerts, and user updates',
    },
    settings: {
      title: 'Admin Operations Settings',
      subtitle: 'Personal profile, assigned department, and granular permissions',
    },
  };

  const currentMeta = tabTitles[currentTab] || {
    title: 'Admin Management',
    subtitle: 'Manage VStudyOnline operations',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Page Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {currentMeta.title}
            </h1>
            <p className="hidden md:block text-xs text-slate-500 truncate">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Universal Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search across students, courses, orders, mentors..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-[#FA5A36] focus:ring-2 focus:ring-[#FA5A36]/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: Date filter, DB status, Refresh, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live DB Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Atlas DB: Live</span>
          </div>

          {/* Date Range Selector */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              aria-label="Select report date range"
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="thismonth">This Month</option>
              <option value="last30days">Last 30 Days</option>
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Data"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
          </button>

          {/* Notifications Chip & Dynamic Dropdown */}
          <div className="relative">
            <button
              onClick={handleToggleNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FA5A36] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Dynamic Notification Dropdown Panel */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#FA5A36]" />
                    <span className="font-bold text-slate-900 text-xs">Operational Alerts</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#FA5A36]">
                    {unreadNotificationsCount} active
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifs ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#FA5A36] mb-1" />
                      Loading alerts...
                    </div>
                  ) : recentNotifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No recent notifications.
                    </div>
                  ) : (
                    recentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 hover:bg-slate-50 transition-colors text-xs flex items-start gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FA5A36] flex items-center justify-center shrink-0 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-[11px] truncate">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigateTab?.('notifications');
                    }}
                    className="text-xs font-bold text-[#FA5A36] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>View All in Notification Logs</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FA5A36] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {user?.firstName} {user?.lastName || ''}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-[#FA5A36] font-semibold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Dept: {user?.department || 'Operations'}</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
