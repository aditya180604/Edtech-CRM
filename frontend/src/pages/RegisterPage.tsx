import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Lock, Mail, User, Phone, ArrowLeft, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
  getPasswordStrength,
} from '../utils/validators';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, getRedirectPathForRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field touched state
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  // Real-time password strength calculation
  const passStrength = getPasswordStrength(password);

  // Form field errors
  const fieldErrors = {
    fullName: touched.fullName ? validateFullName(fullName) : null,
    email: touched.email ? validateEmail(email) : null,
    phone: touched.phone ? validatePhone(phone) : null,
    password: touched.password ? validatePassword(password) : null,
    confirmPassword: touched.confirmPassword ? validatePasswordConfirm(password, confirmPassword) : null,
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success && result.role) {
      const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
      navigate(redirectPath);
    } else if (!result.success) {
      setErrorMessage(result.message || 'Google sign in failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Mark all as touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });

    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const passErr = validatePassword(password);
    const confirmErr = validatePasswordConfirm(password, confirmPassword);

    if (nameErr || emailErr || phoneErr || passErr || confirmErr) {
      return;
    }

    setLoading(true);
    const names = fullName.trim().split(' ');
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || '';

    const result = await register({
      firstName,
      lastName,
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      role: selectedRole,
    });
    setLoading(false);

    if (result.success && result.role) {
      const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
      navigate(redirectPath);
    } else {
      setErrorMessage(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Back to Home link */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/60 border border-slate-100 my-4">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-5">
          <Link to="/" className="flex items-center gap-2 group mb-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Edu<span className="text-indigo-600">Tech</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Create Your Account</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 text-center">
            Join thousands of learners and instructors today.
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs (Student & Instructor ONLY) */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setSelectedRole('STUDENT')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              selectedRole === 'STUDENT'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('INSTRUCTOR')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
              selectedRole === 'INSTRUCTOR'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Instructor
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                maxLength={50}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                placeholder="Rahul Sharma"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  fieldErrors.fullName
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                }`}
              />
            </div>
            {fieldErrors.fullName && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.fullName}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="rahul@example.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                placeholder="+91 9876543210"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  fieldErrors.phone
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                }`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.phone}</span>
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
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
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  fieldErrors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
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

            {/* Live Password Strength Meter */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Strength:</span>
                  <span className={`font-bold ${
                    passStrength.score === 4 ? 'text-emerald-600' :
                    passStrength.score === 3 ? 'text-blue-600' :
                    passStrength.score === 2 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {passStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                  <div className={`rounded-full ${passStrength.score >= 1 ? passStrength.color : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${passStrength.score >= 2 ? passStrength.color : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${passStrength.score >= 3 ? passStrength.color : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${passStrength.score >= 4 ? passStrength.color : 'bg-slate-200'}`} />
                </div>

                {/* Password Requirement Badges */}
                <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                  <span className={`flex items-center gap-1 ${passStrength.rules.minLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {passStrength.rules.minLength ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                    8+ Characters
                  </span>
                  <span className={`flex items-center gap-1 ${passStrength.rules.hasUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {passStrength.rules.hasUpper ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                    Uppercase Letter
                  </span>
                  <span className={`flex items-center gap-1 ${passStrength.rules.hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {passStrength.rules.hasLower ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                    Lowercase Letter
                  </span>
                  <span className={`flex items-center gap-1 ${passStrength.rules.hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {passStrength.rules.hasNumber ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                    Number
                  </span>
                  <span className={`flex items-center gap-1 col-span-2 ${passStrength.rules.hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {passStrength.rules.hasSpecial ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                    Special Symbol (@$!%*?&#)
                  </span>
                </div>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
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
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  fieldErrors.confirmPassword
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
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
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.confirmPassword}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all mt-2 disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              `Create ${selectedRole === 'STUDENT' ? 'Student' : 'Instructor'} Account`
            )}
          </button>
        </form>

        {/* Social Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400 font-medium">or sign up with</span>
          </div>
        </div>

        {/* Only Google Social Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

