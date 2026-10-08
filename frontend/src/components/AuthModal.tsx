import React, { useState } from 'react';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirm,
  getPasswordStrength,
} from '../utils/validators';

export const AuthModal: React.FC = () => {
  const { authMode, closeAuth, switchMode } = useAuthModal();
  const { login, register, loginWithGoogle, getRedirectPathForRole } = useAuth();
  const navigate = useNavigate();

  // Role selector (Student & Instructor ONLY - Admin removed!)
  const [signupRole, setSignupRole] = useState<'STUDENT' | 'INSTRUCTOR'>('STUDENT');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field touched states
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });
  const [signupTouched, setSignupTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const passStrength = getPasswordStrength(password);

  if (!authMode) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success && result.role) {
      closeAuth();
      const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
      navigate(redirectPath);
    } else if (!result.success) {
      setErrorMessage(result.message || 'Google sign in failed.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setLoginTouched({ email: true, password: true });
    const emailErr = validateEmail(email);
    const passErr = password ? null : 'Password is required.';

    if (emailErr || passErr) {
      return;
    }

    setLoading(true);
    const result = await login({ email: email.trim(), password });
    setLoading(false);

    if (result.success && result.role) {
      closeAuth();
      const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
      navigate(redirectPath);
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setSignupTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validatePasswordConfirm(password, confirmPassword);

    if (nameErr || emailErr || passErr || confirmErr) {
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
      password,
      role: signupRole,
    });
    setLoading(false);

    if (result.success && result.role) {
      closeAuth();
      const redirectPath = getRedirectPathForRole(result.role, result.isProfileCompleted);
      navigate(redirectPath);
    } else {
      setErrorMessage(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeAuth}
    >
      <div
        className="relative w-full max-w-[420px] bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 select-none max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuth}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header with Graduation Cap */}
        <div className="flex flex-col items-center mb-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-1.5">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Edu<span className="text-indigo-600">Tech</span>
          </span>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-500 text-center">
            {authMode === 'login'
              ? 'Sign in to continue your learning journey.'
              : 'Join thousands of learners and start learning today.'}
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ===================== SIGN IN FORM ===================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3" noValidate>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setLoginTouched((prev) => ({ ...prev, email: true }))}
                  placeholder="toppix851@gmail.com"
                  className={`w-full pl-9 pr-3 py-2 bg-slate-50 text-xs text-slate-900 rounded-lg border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                    loginTouched.email && validateEmail(email)
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                  }`}
                />
              </div>
              {loginTouched.email && validateEmail(email) && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                  <span>{validateEmail(email)}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setLoginTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="••••••••••••"
                  className={`w-full pl-9 pr-9 py-2 bg-slate-50 text-xs text-slate-900 rounded-lg border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                    loginTouched.password && !password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {loginTouched.password && !password && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                  <span>Password is required.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* ===================== SIGN UP FORM ===================== */}
        {authMode === 'signup' && (
          <div className="space-y-3">
            {/* Role Tabs */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg mb-2">
              <button
                type="button"
                onClick={() => setSignupRole('STUDENT')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
                  signupRole === 'STUDENT'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setSignupRole('INSTRUCTOR')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
                  signupRole === 'INSTRUCTOR'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Instructor
              </button>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-2.5" noValidate>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setSignupTouched((prev) => ({ ...prev, fullName: true }))}
                    placeholder="Rahul Sharma"
                    className={`w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs text-slate-900 rounded-lg border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                      signupTouched.fullName && validateFullName(fullName)
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    }`}
                  />
                </div>
                {signupTouched.fullName && validateFullName(fullName) && (
                  <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span>{validateFullName(fullName)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Email address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setSignupTouched((prev) => ({ ...prev, email: true }))}
                    placeholder="rahul@example.com"
                    className={`w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs text-slate-900 rounded-lg border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                      signupTouched.email && validateEmail(email)
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    }`}
                  />
                </div>
                {signupTouched.email && validateEmail(email) && (
                  <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span>{validateEmail(email)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setSignupTouched((prev) => ({ ...prev, password: true }))}
                    placeholder="••••••••••••"
                    className={`w-full pl-9 pr-9 py-1.5 bg-slate-50 text-xs text-slate-900 rounded-lg border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                      signupTouched.password && validatePassword(password)
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password strength mini meter */}
                {password.length > 0 && (
                  <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Strength:</span>
                      <span className={`font-bold ${
                        passStrength.score === 4 ? 'text-emerald-600' :
                        passStrength.score === 3 ? 'text-blue-600' :
                        passStrength.score === 2 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {passStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1 w-full">
                      <div className={`rounded-full ${passStrength.score >= 1 ? passStrength.color : 'bg-slate-200'}`} />
                      <div className={`rounded-full ${passStrength.score >= 2 ? passStrength.color : 'bg-slate-200'}`} />
                      <div className={`rounded-full ${passStrength.score >= 3 ? passStrength.color : 'bg-slate-200'}`} />
                      <div className={`rounded-full ${passStrength.score >= 4 ? passStrength.color : 'bg-slate-200'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-0.5 text-[9px] pt-0.5">
                      <span className={`flex items-center gap-1 ${passStrength.rules.minLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passStrength.rules.minLength ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : <XCircle className="w-2.5 h-2.5 shrink-0" />}
                        8+ Chars
                      </span>
                      <span className={`flex items-center gap-1 ${passStrength.rules.hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passStrength.rules.hasUpper ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : <XCircle className="w-2.5 h-2.5 shrink-0" />}
                        Uppercase
                      </span>
                      <span className={`flex items-center gap-1 ${passStrength.rules.hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passStrength.rules.hasLower ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : <XCircle className="w-2.5 h-2.5 shrink-0" />}
                        Lowercase
                      </span>
                      <span className={`flex items-center gap-1 ${passStrength.rules.hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {passStrength.rules.hasSpecial ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : <XCircle className="w-2.5 h-2.5 shrink-0" />}
                        Symbol (@$!%*?)
                      </span>
                    </div>
                  </div>
                )}
                {signupTouched.password && validatePassword(password) && (
                  <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span>{validatePassword(password)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setSignupTouched((prev) => ({ ...prev, confirmPassword: true }))}
                    placeholder="••••••••••••"
                    className={`w-full pl-9 pr-9 py-1.5 bg-slate-50 text-xs text-slate-900 rounded-lg border transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                      signupTouched.confirmPassword && validatePasswordConfirm(password, confirmPassword)
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {signupTouched.confirmPassword && validatePasswordConfirm(password, confirmPassword) && (
                  <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span>{validatePasswordConfirm(password, confirmPassword)}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-70 cursor-pointer mt-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  `Create ${signupRole === 'STUDENT' ? 'Student' : 'Instructor'} Account`
                )}
              </button>
            </form>
          </div>
        )}

        {/* Social Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-[10px]">
            <span className="px-2.5 bg-white text-slate-400 font-medium">
              {authMode === 'login' ? 'or continue with' : 'or sign up with'}
            </span>
          </div>
        </div>

        {/* Only Google Social Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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

        {/* Modal Switcher Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-3">
          {authMode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  switchMode('signup');
                }}
                className="font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  switchMode('login');
                }}
                className="font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
