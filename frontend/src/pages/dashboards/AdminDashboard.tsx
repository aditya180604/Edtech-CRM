import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AdminDashboardData } from '../../api/admin';
import { AdminSidebar, hasAdminTabPermission } from '../../components/admin/AdminSidebar';
import type { AdminTab } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminOverviewTab } from '../../components/admin/tabs/AdminOverviewTab';
import { AdminStudentsTab } from '../../components/admin/tabs/AdminStudentsTab';
import { AdminInstructorsTab } from '../../components/admin/tabs/AdminInstructorsTab';
import { AdminCoursesTab } from '../../components/admin/tabs/AdminCoursesTab';
import { AdminPaymentsTab } from '../../components/admin/tabs/AdminPaymentsTab';
import { AdminConsultationsTab } from '../../components/admin/tabs/AdminConsultationsTab';
import { AdminSupportTab } from '../../components/admin/tabs/AdminSupportTab';
import { AdminReportsTab } from '../../components/admin/tabs/AdminReportsTab';
import { AdminNotificationsTab } from '../../components/admin/tabs/AdminNotificationsTab';
import { AdminSettingsTab } from '../../components/admin/tabs/AdminSettingsTab';
import { CheckCircle2, AlertCircle, X, Lock, ShieldAlert } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoadingDashboard(true);
      // Map dateRange to ISO dates if needed
      let startDate: string | undefined;
      const now = new Date();

      if (dateRange === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        startDate = d.toISOString();
      } else if (dateRange === 'last7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString();
      } else if (dateRange === 'thismonth') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = d.toISOString();
      } else if (dateRange === 'last30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString();
      }

      const res = await adminApi.getDashboard({
        startDate,
        endDate: now.toISOString(),
      });

      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load admin dashboard overview:', err);
      showToast('Could not fetch real-time overview metrics', 'error');
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [dateRange, showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async () => {
    await logout('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800 antialiased">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-800">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Persistent Sidebar (Desktop) + Responsive Drawer (Mobile) */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
        stats={{
          openTickets: dashboardData?.metrics?.openSupportTicketsCount,
          pendingInstructors: dashboardData?.metrics?.pendingInstructors,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Sticky Top Header Bar */}
        <AdminHeader
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={loadDashboardData}
          isLoading={isLoadingDashboard}
          user={user}
          onLogout={handleLogout}
          unreadNotificationsCount={dashboardData?.metrics?.openSupportTicketsCount || 0}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto">
          {!hasAdminTabPermission(currentTab, user) ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto text-center space-y-4 my-12 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-md shadow-rose-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  You do not possess the required operational privilege to access the{' '}
                  <strong className="text-slate-800 capitalize">{currentTab}</strong> module.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 text-left max-w-md mx-auto">
                <p className="font-semibold mb-1">Administrative Scopes Notice</p>
                <p className="text-[11px] text-amber-700">
                  Operational privileges are governed strictly by the Super Admin under the principle of least privilege. If you require access to this section, please contact your Super Admin.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentTab('overview')}
                  className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#e04825] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-[#FA5A36]/30"
                >
                  Return to Overview
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <AdminOverviewTab
                  data={dashboardData}
                  isLoading={isLoadingDashboard}
                  onNavigateTab={(t) => setCurrentTab(t)}
                  user={user}
                />
              )}

              {currentTab === 'students' && (
                <AdminStudentsTab onNotify={showToast} />
              )}

              {currentTab === 'instructors' && (
                <AdminInstructorsTab onNotify={showToast} />
              )}

              {currentTab === 'courses' && (
                <AdminCoursesTab onNotify={showToast} />
              )}

              {currentTab === 'payments' && (
                <AdminPaymentsTab onNotify={showToast} />
              )}

              {currentTab === 'consultations' && (
                <AdminConsultationsTab onNotify={showToast} />
              )}

              {currentTab === 'support' && (
                <AdminSupportTab onNotify={showToast} />
              )}

              {currentTab === 'reports' && (
                <AdminReportsTab onNotify={showToast} />
              )}

              {currentTab === 'notifications' && (
                <AdminNotificationsTab onNotify={showToast} />
              )}

              {currentTab === 'settings' && (
                <AdminSettingsTab onNotify={showToast} currentUser={user} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
