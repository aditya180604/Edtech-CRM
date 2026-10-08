import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { validateEmail } from '../utils/validators';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, getRedirectPathForRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  // Field validation touched & error states
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string | null; password?: string | null }>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === 'true') {
      setSessionExpiredNotice(true);
    }
  }, [location.search]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (touched.password) {
      setFieldErrors((prev) => ({
        ...prev,
        password: val ? null : 'Password is required.',
      }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setFieldErrors((prev) => ({
      ...prev,
      password: password ? null : 'Password is required.',
    }));
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success && result.role) {
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam));
      } else {
        const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
        navigate(redirectPath);
      }
    } else if (!result.success) {
      setErrorMessage(result.message || 'Google sign in failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate all fields
    const emailErr = validateEmail(email);
    const passErr = password ? null : 'Password is required.';

    setFieldErrors({ email: emailErr, password: passErr });
    setTouched({ email: true, password: true });

    if (emailErr || passErr) {
      return;
    }

    setLoading(true);
    const result = await login({ email: email.trim(), password });
    setLoading(false);

    if (result.success && result.role) {
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam));
      } else {
        const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
        navigate(redirectPath);
      }
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white">
      {/* Back to Home link */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Edu<span className="text-indigo-600">Tech</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 text-center">
            Sign in to continue your learning journey.
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Your session has expired. Please sign in again to access your dashboard.</span>
          </div>
        )}

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  touched.email && fieldErrors.email
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                }`}
              />
            </div>
            {touched.email && fieldErrors.email && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                maxLength={128}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={handlePasswordBlur}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  touched.password && fieldErrors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.password}</span>
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
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Social Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400 font-medium">or continue with</span>
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
        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-indigo-600 hover:text-indigo-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
