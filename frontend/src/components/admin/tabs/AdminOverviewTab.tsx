import React from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  IndianRupee,
  CalendarCheck,
  LifeBuoy,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import type { AdminDashboardData } from '../../../api/admin';
import type { AdminTab } from '../AdminSidebar';
import { hasAdminTabPermission } from '../AdminSidebar';

interface AdminOverviewTabProps {
  data: AdminDashboardData | null;
  isLoading: boolean;
  onNavigateTab: (tab: AdminTab) => void;
  user?: any;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  data,
  isLoading,
  onNavigateTab,
  user,
}) => {
  if (isLoading && !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-200/60 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200/60 rounded-2xl"></div>
          <div className="h-80 bg-slate-200/60 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalStudents: 0,
    newStudentsThisMonth: 0,
    totalInstructors: 0,
    pendingInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    grossRevenue: 0,
    refundedAmount: 0,
    netRevenue: 0,
    verifiedPurchasesCount: 0,
    totalOrdersCount: 0,
    upcomingConsultationsCount: 0,
    openSupportTicketsCount: 0,
  };

  const growthTimeline = data?.growthTimeline || [];
  const recentActivity = data?.recentActivity || [];
  const upcomingConsultations = data?.upcomingConsultations || [];

  // Calculate highest revenue point for SVG scaling
  const maxRevenue = Math.max(...growthTimeline.map((p) => p.revenue), 1000);
  const maxStudents = Math.max(...growthTimeline.map((p) => p.students), 10);

  const canViewStudents = hasAdminTabPermission('students', user);
  const canViewInstructors = hasAdminTabPermission('instructors', user);
  const canViewCourses = hasAdminTabPermission('courses', user);
  const canViewPayments = hasAdminTabPermission('payments', user);
  const canViewConsultations = hasAdminTabPermission('consultations', user);
  const canViewSupport = hasAdminTabPermission('support', user);

  return (
    <div className="space-y-6">
      {/* Key Performance Metric Cards (Filtered by Admin Privileges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Students */}
        {canViewStudents && (
          <div
            onClick={() => onNavigateTab('students')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#FA5A36]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                +{metrics.newStudentsThisMonth} new
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.totalStudents.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-medium text-slate-500">Total Students</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
            </div>
          </div>
        )}

        {/* Metric 2: Instructors */}
        {canViewInstructors && (
          <div
            onClick={() => onNavigateTab('instructors')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#FA5A36]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              {metrics.pendingInstructors > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {metrics.pendingInstructors} pending
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.totalInstructors.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-medium text-slate-500">Instructors</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
            </div>
          </div>
        )}

        {/* Metric 3: Courses */}
        {canViewCourses && (
          <div
            onClick={() => onNavigateTab('courses')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#FA5A36]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {metrics.publishedCourses} live
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.totalCourses.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-medium text-slate-500">Catalog Courses</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
            </div>
          </div>
        )}

        {/* Metric 4: Net Revenue */}
        {canViewPayments && (
          <div
            onClick={() => onNavigateTab('payments')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#FA5A36]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FA5A36] flex items-center justify-center group-hover:scale-105 transition-transform">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {metrics.verifiedPurchasesCount} orders
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{metrics.netRevenue.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-medium text-slate-500">Net Revenue</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
            </div>
          </div>
        )}

        {/* Metric 5: Consultations */}
        {canViewConsultations && (
          <div
            onClick={() => onNavigateTab('consultations')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#FA5A36]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.upcomingConsultationsCount.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-medium text-slate-500">Consultations</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
            </div>
          </div>
        )}

        {/* Metric 6: Support Tickets */}
        {canViewSupport && (
          <div
            onClick={() => onNavigateTab('support')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#FA5A36]/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  metrics.openSupportTicketsCount > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {metrics.openSupportTicketsCount} open
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.openSupportTicketsCount}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-medium text-slate-500">Support Tickets</p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
            </div>
          </div>
        )}
      </div>

      {/* Middle Row: Platform Growth Trend Chart & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Chart (SVG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FA5A36] text-[11px] font-semibold mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Operational Velocity</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Revenue & Enrollment Trajectory
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              {canViewPayments && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-[#FA5A36]"></span>
                  <span className="text-slate-600">Verified Revenue (₹)</span>
                </div>
              )}
              {canViewStudents && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-500"></span>
                  <span className="text-slate-600">Students</span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Trend Chart Visualization */}
          <div className="h-64 w-full flex flex-col justify-end">
            {growthTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No historical records in the selected period.
              </div>
            ) : (
              <div className="h-full flex items-end gap-2 sm:gap-4 pt-6 border-b border-slate-100">
                {growthTimeline.map((item, index) => {
                  const revHeight = Math.max(
                    8,
                    Math.round((item.revenue / maxRevenue) * 180)
                  );
                  const studHeight = Math.max(
                    8,
                    Math.round((item.students / maxStudents) * 180)
                  );

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 transition-opacity z-20 whitespace-nowrap shadow-lg">
                        {canViewPayments ? `₹${item.revenue.toLocaleString()} • ` : ''}{canViewStudents ? `${item.students} students` : ''}
                      </div>

                      <div className="w-full flex items-end justify-center gap-1">
                        {/* Revenue Bar */}
                        {canViewPayments && (
                          <div
                            style={{ height: `${revHeight}px` }}
                            className="w-1/2 max-w-[20px] bg-gradient-to-t from-[#FA5A36] to-[#FF8A65] rounded-t-md transition-all group-hover:brightness-110"
                          ></div>
                        )}
                        {/* Students Bar */}
                        {canViewStudents && (
                          <div
                            style={{ height: `${studHeight}px` }}
                            className="w-1/2 max-w-[20px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all group-hover:brightness-110"
                          ></div>
                        )}
                      </div>

                      <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations & Operational Scope Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Operations Desk
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                All Systems Normal
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Authorized admin actions are strictly audited and synced with
              MongoDB Atlas.
            </p>

            <div className="space-y-2.5">
              {canViewStudents && (
                <button
                  onClick={() => onNavigateTab('students')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#FA5A36]/40 hover:bg-orange-50/20 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Manage Students
                      </p>
                      <p className="text-[10px] text-slate-500">
                        View enrollments & account standing
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
                </button>
              )}

              {canViewInstructors && (
                <button
                  onClick={() => onNavigateTab('instructors')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#FA5A36]/40 hover:bg-orange-50/20 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Instructor Moderation
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Inspect verified directory
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
                </button>
              )}

              {canViewCourses && (
                <button
                  onClick={() => onNavigateTab('courses')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#FA5A36]/40 hover:bg-orange-50/20 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Course Catalog Oversight
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Review published & draft courses
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
                </button>
              )}

              {canViewPayments && (
                <button
                  onClick={() => onNavigateTab('payments')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#FA5A36]/40 hover:bg-orange-50/20 text-left transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FA5A36] flex items-center justify-center font-bold">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Cashfree Reconciliations
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Inspect success vs refunds
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FA5A36] transition-colors" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Platform Uptime: 99.98%</span>
            <span className="font-semibold text-emerald-600">Zero Faults</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Consultations & Live Audit Activity */}
      <div className={`grid grid-cols-1 ${canViewConsultations ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* Upcoming Consultations */}
        {canViewConsultations && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#FA5A36]" />
              <h2 className="text-base font-bold text-slate-900">
                Upcoming 1-on-1 Consultations
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('consultations')}
              className="text-xs font-semibold text-[#FA5A36] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {upcomingConsultations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No upcoming consultations scheduled currently.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingConsultations.slice(0, 5).map((consultation) => (
                <div
                  key={consultation.id}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {consultation.student.name?.[0] || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {consultation.student.name}
                        <span className="font-normal text-slate-400 mx-1">
                          with
                        </span>
                        <span className="text-purple-600 font-medium">
                          {consultation.instructor.name}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(consultation.startTime).toLocaleString(
                            'en-IN',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                        <span>• {consultation.durationMinutes} mins</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        consultation.status === 'SCHEDULED' ||
                        consultation.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {consultation.status}
                    </span>
                    <p className="text-[11px] font-bold text-slate-800 mt-0.5">
                      ₹{consultation.fee}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Live Audit & System Activity Feed */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Recent Platform Activity
              </h2>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Feed
            </span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent audit logs available.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 leading-snug">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      By <span className="font-medium text-slate-700">{log.actor.name || log.actor.email}</span> ({log.actor.role})
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
