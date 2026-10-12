import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Shield, Users, BookOpen, MessageSquare, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout('/');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-semibold text-2xl shrink-0 border border-[#FFCCC2]">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] text-xs font-semibold mb-1">
                Admin Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Welcome, {user?.firstName || 'Admin'} {user?.lastName || ''}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {user?.email} • Role: <span className="font-semibold text-[#FA5A36]">{user?.role}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">1,480</p>
              <p className="text-xs font-semibold text-slate-500">Registered Users</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">4</p>
              <p className="text-xs font-semibold text-slate-500">Pending Approvals</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">32</p>
              <p className="text-xs font-semibold text-slate-500">Active Courses</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">12</p>
              <p className="text-xs font-semibold text-slate-500">CRM Inquiries</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
