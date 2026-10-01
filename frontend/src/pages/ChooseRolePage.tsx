import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Users, Shield, ArrowRight } from 'lucide-react';

export const ChooseRolePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor' | 'admin'>('student');

  const roles = [
    {
      id: 'student',
      title: 'I am a Student',
      description: 'Access courses, join live webinars and track your learning progress.',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 text-blue-600',
      borderColor: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20',
      target: '/dashboard',
    },
    {
      id: 'instructor',
      title: 'I am an Instructor',
      description: 'Create and publish courses, conduct live sessions and manage your students.',
      icon: Users,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-600',
      borderColor: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20',
      target: '/instructor/dashboard',
    },
    {
      id: 'admin',
      title: 'I am an Admin',
      description: 'Manage platform, users, courses, moderation and monitor analytics.',
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20',
      target: '/admin/dashboard',
    },
  ];

  const handleContinue = () => {
    const roleObj = roles.find((r) => r.id === selectedRole);
    navigate(roleObj?.target || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Edu<span className="text-indigo-600">Tech</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Choose Your Role</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 text-center">
            Select how you want to use EduTech
          </p>
        </div>

        {/* Roles List */}
        <div className="space-y-4 mb-8">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id as any)}
                className={`cursor-pointer p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-600/15 bg-indigo-50/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${role.bgColor}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {role.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xs">
                      {role.description}
                    </p>
                  </div>
                </div>

                {/* Radio Circle */}
                <div className="shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
