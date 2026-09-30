import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { BookOpen, GraduationCap, Play, Award, Clock, ArrowRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-1">
                Student Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Welcome, {user?.firstName || 'Learner'} {user?.lastName || ''}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {user?.email} • Status: <span className="font-semibold text-emerald-600">{user?.status || 'ACTIVE'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">2</p>
              <p className="text-xs font-semibold text-slate-500">Enrolled Courses</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">5</p>
              <p className="text-xs font-semibold text-slate-500">Purchased Topics</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">14.5 hrs</p>
              <p className="text-xs font-semibold text-slate-500">Learning Time</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">1</p>
              <p className="text-xs font-semibold text-slate-500">Certificate Earned</p>
            </div>
          </div>
        </div>

        {/* Continue Learning / Course Upgrade Notice */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 inline-block">
              Atomic Credit Opportunity
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
              You have accumulated ₹598 in Topic Credits!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Upgrade to the complete <strong>React Development Bootcamp</strong> anytime for only ₹1,401. Your historical topic purchases are fully credited!
            </p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-white text-slate-950 hover:bg-indigo-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Explore Upgrades</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};
