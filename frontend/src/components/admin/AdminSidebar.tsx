import React from 'react';
import { EduLogo } from '../ui/EduLogo';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  CalendarCheck,
  LifeBuoy,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const ADMIN_TABS = [
  'overview',
  'students',
  'instructors',
  'courses',
  'payments',
  'consultations',
  'support',
  'reports',
  'notifications',
  'settings',
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number];

export const TAB_PERMISSIONS: Record<AdminTab, string[]> = {
  overview: [],
  students: ['VIEW_STUDENTS', 'MANAGE_STUDENTS'],
  instructors: ['VIEW_INSTRUCTORS', 'MANAGE_INSTRUCTORS'],
  courses: ['VIEW_COURSES', 'MANAGE_COURSES'],
  payments: ['VIEW_PAYMENTS', 'MANAGE_PAYMENTS'],
  consultations: ['VIEW_CONSULTATIONS', 'MANAGE_CONSULTATIONS'],
  support: ['VIEW_SUPPORT', 'MANAGE_SUPPORT'],
  reports: ['VIEW_REPORTS'],
  notifications: ['VIEW_NOTIFICATIONS'],
  settings: [],
};

export const hasAdminTabPermission = (tab: AdminTab, user: any): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  const required = TAB_PERMISSIONS[tab] || [];
  if (required.length === 0) return true;
  const userPerms: string[] = Array.isArray(user.adminPermissions) ? user.adminPermissions : [];
  return required.some((perm) => userPerms.includes(perm));
};

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  user: any;
  onLogout: () => void;
  stats?: {
    openTickets?: number;
    pendingInstructors?: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  user,
  onLogout,
  stats,
}) => {
  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    {
      id: 'instructors',
      label: 'Instructors',
      icon: GraduationCap,
      badge: stats?.pendingInstructors ? stats.pendingInstructors : undefined,
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    { id: 'courses', label: 'Courses Catalog', icon: BookOpen },
    { id: 'payments', label: 'Payments & Revenue', icon: CreditCard },
    { id: 'consultations', label: 'Consultations', icon: CalendarCheck },
    {
      id: 'support',
      label: 'Support & CRM',
      icon: LifeBuoy,
      badge: stats?.openTickets ? stats.openTickets : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200',
    },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  const visibleNavItems = navItems.filter((item) => hasAdminTabPermission(item.id, user));

  const handleNavClick = (tabId: AdminTab) => {
    onSelectTab(tabId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Persistent White Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white text-slate-700 flex flex-col border-r border-slate-200/90 shadow-xs transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 shrink-0">
          <EduLogo size="md" variant="light" to="/admin/dashboard" showText={true} />
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Scope Banner */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FA5A36] ring-4 ring-[#FA5A36]/20 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              {user?.department ? `${user.department} Panel` : 'Operations Panel'}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 font-mono font-medium">
            {user?.role || 'ADMIN'}
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Management
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#FA5A36] text-white shadow-md shadow-[#FA5A36]/25 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Super Admin Switch Shortcut (if current user is SUPER_ADMIN) */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="p-3 mx-3 mb-2 rounded-xl bg-purple-50/80 border border-purple-200/80">
            <a
              href="/super-admin"
              className="flex items-center justify-between text-xs text-purple-700 hover:text-purple-900 font-semibold transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Super Admin Console</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Admin Account Profile Box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FA5A36] to-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.firstName} {user?.lastName || ''}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.department || 'Operations'} • {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
