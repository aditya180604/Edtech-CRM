import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { validatePassword, validatePasswordConfirm, getPasswordStrength } from '../utils/validators';
import { EduLogo } from '../components/ui/EduLogo';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmResetPassword } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const oobCode = queryParams.get('oobCode') || queryParams.get('code') || '';
  const token = queryParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasCodeOrToken = Boolean(oobCode || token);
  const passStrength = getPasswordStrength(password);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTouched({ password: true, confirmPassword: true });

    const passErr = validatePassword(password);
    const confirmErr = validatePasswordConfirm(password, confirmPassword);

    if (passErr || confirmErr) {
      return;
    }

    setLoading(true);
    const res = await confirmResetPassword({
      oobCode: oobCode || undefined,
      token: token || undefined,
      newPassword: password,
    });
    setLoading(false);

    if (res.success) {
      setIsSuccess(true);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Back to Home link */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#FA5A36] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3">
            <EduLogo size="lg" to="/" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {isSuccess ? 'Password Reset Complete' : 'Create New Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 text-center">
            {isSuccess
              ? 'Your password has been reset successfully. You can now sign in.'
              : 'Choose a strong, unique password to secure your account.'}
          </p>
        </div>

        {/* If Missing Token / Action Code */}
        {!hasCodeOrToken && !isSuccess ? (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="font-bold">Missing or Expired Reset Link</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                This password reset link is invalid or incomplete. Please request a new password reset link from the login page.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#FA5A36] hover:bg-[#E04322] text-white font-semibold text-sm rounded-xl transition-all shadow-xs shadow-[#FA5A36]/25 cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        ) : isSuccess ? (
          /* Success Confirmation View */
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Your new password is now active.
              </p>
              <p className="text-xs text-slate-500">
                You can now log in with your updated credentials and resume learning.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#FA5A36] hover:bg-[#E04322] text-white font-semibold text-sm rounded-xl transition-all shadow-xs shadow-[#FA5A36]/25 cursor-pointer"
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          /* Reset Password Form */
          <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="At least 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                    touched.password && validatePassword(password)
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-[#FA5A36] focus:ring-[#FA5A36]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passStrength.score <= 1
                          ? 'w-1/4 bg-red-500'
                          : passStrength.score === 2
                          ? 'w-2/4 bg-amber-500'
                          : passStrength.score === 3
                          ? 'w-3/4 bg-blue-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex justify-between">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-slate-700">{passStrength.label}</span>
                  </p>
                </div>
              )}

              {touched.password && validatePassword(password) && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validatePassword(password)}</span>
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  placeholder="Re-type new password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                    touched.confirmPassword && validatePasswordConfirm(password, confirmPassword)
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-[#FA5A36] focus:ring-[#FA5A36]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && validatePasswordConfirm(password, confirmPassword) && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{validatePasswordConfirm(password, confirmPassword)}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] text-white font-semibold text-sm rounded-xl shadow-xs shadow-[#FA5A36]/25 transition-all mt-2 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                'Set New Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
