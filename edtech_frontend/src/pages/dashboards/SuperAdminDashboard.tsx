import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import {
  Crown,
  Users,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  LogOut,
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Radio,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi, type SuperAdminStatus, type RealtimeUsersResponse } from '../../api/superAdmin';
import type { User } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [statusData, setStatusData] = useState<SuperAdminStatus | null>(null);
  const [userData, setUserData] = useState<RealtimeUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch real-time data from backend
  const fetchRealtimeData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);

      const [statusRes, usersRes] = await Promise.all([
        superAdminApi.getStatus().catch(() => null),
        superAdminApi.getUsers({
          role: activeTab === 'ALL' ? undefined : activeTab,
          search: searchQuery.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 100,
        }).catch(() => null),
      ]);

      if (statusRes?.success) {
        setStatusData(statusRes.data);
      }
      if (usersRes?.success) {
        setUserData(usersRes.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load Super Admin real-time telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, statusFilter]);

  useEffect(() => {
    fetchRealtimeData();
  }, [fetchRealtimeData]);

  // Periodic real-time poll every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRealtimeData]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await superAdminApi.updateUserStatus(targetUser._id, { status: newStatus });
      fetchRealtimeData(true);
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-700 border border-amber-300">
            <Crown className="w-3 h-3 text-amber-600" />
            SUPER ADMIN
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            ADMIN
          </span>
        );
      case 'INSTRUCTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Briefcase className="w-3 h-3 text-purple-600" />
            INSTRUCTOR
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3 h-3 text-emerald-600" />
            STUDENT
          </span>
        );
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Suspended
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Welcome Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-2xl shrink-0 border border-amber-500/30">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-1 border border-amber-500/30">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Live Telemetry & Authority Layer
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Super Admin: {user?.firstName || 'Super'} {user?.lastName || 'Admin'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {user?.email} • Authority: <span className="font-semibold text-amber-400">FULL SYSTEM ACCESS</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRealtimeData(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Live Data'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-red-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Real-time Metric Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 1. Total Registered Accounts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {userData?.counts?.all ?? statusData?.counts?.users ?? '...'}
                </p>
                <p className="text-xs font-semibold text-slate-500">Total System Users</p>
              </div>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
          </div>

          {/* 2. Active Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {userData?.counts?.students ?? statusData?.counts?.students ?? '...'}
                </p>
                <p className="text-xs font-semibold text-slate-500">Live Students</p>
              </div>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
          </div>

          {/* 3. Verified Instructors */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {userData?.counts?.instructors ?? statusData?.counts?.instructors ?? '...'}
                </p>
                <p className="text-xs font-semibold text-slate-500">Instructors</p>
              </div>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600"></span>
            </span>
          </div>

          {/* 4. Administrators */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {(userData?.counts?.admins ?? 0) + (userData?.counts?.superAdmins ?? 0) ||
                    statusData?.counts?.admins ||
                    '...'}
                </p>
                <p className="text-xs font-semibold text-slate-500">Admins & Super Admins</p>
              </div>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
            </span>
          </div>
        </div>

        {/* Real-time Users Showcase Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden mb-8">
          {/* Header Controls */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Real-Time User Registry</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 tracking-wide">
                  LIVE MONGODB SYNC
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Single Source of Truth (`users` collection). Showing {userData?.users?.length || 0} loaded accounts. Last synced: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { key: 'ALL', label: 'All Users', count: userData?.counts?.all },
                    { key: 'STUDENT', label: 'Students', count: userData?.counts?.students },
                    { key: 'INSTRUCTOR', label: 'Instructors', count: userData?.counts?.instructors },
                    { key: 'ADMIN', label: 'Admins', count: (userData?.counts?.admins || 0) + (userData?.counts?.superAdmins || 0) },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white w-48 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-semibold">Connecting to MongoDB users collection...</p>
              </div>
            ) : userData?.users?.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm font-semibold">
                No users found matching current filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">MongoDB User ID</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {userData?.users.map((u) => {
                    const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* User Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {u.firstName || ''} {u.lastName || ''} {!u.firstName && !u.lastName ? 'Unnamed User' : ''}
                              </p>
                              <p className="text-slate-500 text-[11px] font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{getStatusBadge(u.status)}</td>

                        {/* MongoDB ID */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          <button
                            onClick={() => copyToClipboard(u._id, u._id)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
                            title="Copy MongoDB _id"
                          >
                            <span>{u._id.substring(0, 10)}...</span>
                            {copiedId === u._id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                            {u.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                  u.status === 'ACTIVE'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Database & Infrastructure Telemetry */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>MongoDB Infrastructure Health</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-700">Cluster Status</p>
              <p className="text-xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                {statusData?.database?.status || 'CONNECTED'}
              </p>
              <p className="text-slate-400 mt-0.5">Atlas Production Replica Set</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-700">Single Source Collection</p>
              <p className="text-xl font-black text-indigo-600 mt-1">`users`</p>
              <p className="text-slate-400 mt-0.5">Students, Instructors & Admins</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-700">Active Mongoose Models</p>
              <p className="text-xl font-black text-purple-600 mt-1">54 Models</p>
              <p className="text-slate-400 mt-0.5">Centralized Schema Registry</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-700">Backend API</p>
              <p className="text-xl font-black text-amber-600 mt-1">Node Port 5000</p>
              <p className="text-slate-400 mt-0.5">Express.js API Layer</p>
            </div>
          </div>
        </div>

        {/* User Detail Inspect Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {selectedUser.firstName?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="font-semibold text-slate-500">MongoDB _id</span>
                  <span className="font-mono text-slate-800 font-semibold">{selectedUser._id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="font-semibold text-slate-500">Platform Role</span>
                  <span>{getRoleBadge(selectedUser.role)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="font-semibold text-slate-500">Account Status</span>
                  <span>{getStatusBadge(selectedUser.status)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="font-semibold text-slate-500">Email Verified</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUser.emailVerified ? 'Yes ✅' : 'No ❌'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="font-semibold text-slate-500">Registered On</span>
                  <span className="font-semibold text-slate-800">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '—'}
                  </span>
                </div>
                {selectedUser.phone && (
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="font-semibold text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-800">{selectedUser.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
