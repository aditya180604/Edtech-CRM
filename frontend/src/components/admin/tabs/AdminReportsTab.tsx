import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  RefreshCw,
  IndianRupee,
  Users,
  GraduationCap,
  BookOpen,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminReportData } from '../../../api/admin';

interface AdminReportsTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({ onNotify }) => {
  const [report, setReport] = useState<AdminReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('30d');

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getReports({ range });
      if (res.success) {
        setReport(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      onNotify?.('Failed to generate analytical report', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [range, onNotify]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const overview = report?.overview || {
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    grossRevenue: 0,
    netRevenue: 0,
    consultationsCount: 0,
  };

  const categories = report?.categoryBreakdown || [];
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      {/* Header & Range Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#FA5A36]" />
            <h2 className="text-lg font-bold text-slate-900">Analytics & Financial Reports</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated revenue, enrollment metrics, and curriculum distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label="Select report time window"
              className="bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last 1 Year</option>
              <option value="all">All Time History</option>
            </select>
          </div>

          <button
            onClick={fetchReports}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FA5A36]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Gross Collections</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ₹{overview.grossRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Total successful payments received</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Net Realized Revenue</p>
          <p className="text-2xl font-bold text-[#FA5A36] mt-1">
            ₹{overview.netRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">After processed refunds deduction</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Enrolled Learners</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {overview.totalStudents.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Active student user accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Completed Consultations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {overview.consultationsCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">1-on-1 expert mentorship sessions</p>
        </div>
      </div>

      {/* Category Distribution Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Curriculum by Subject Sector</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {categories.length} Categories
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No course categories available.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat, idx) => {
              const percentage = Math.round((cat.count / maxCategoryCount) * 100);

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="text-slate-500 font-medium">{cat.count} courses</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-gradient-to-r from-[#FA5A36] to-amber-500 rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
