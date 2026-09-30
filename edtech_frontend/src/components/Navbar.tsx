import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, LayoutDashboard, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';
import { normalizeImageUrl } from '../utils/imageUrl';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin, openSignup } = useAuthModal();
  const { user, isAuthenticated, logout, getRedirectPathForRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Courses', path: '/courses' },
    { name: 'Topics', path: '/topics' },
    { name: 'Learning Paths', path: '/learning-paths' },
    { name: 'Instructors', path: '/instructors' },
    { name: 'Webinars', path: '/webinars' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardPath = user ? getRedirectPathForRole(user.role) : '/dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          {/* Logo with Graduation Cap matching design */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Edu<span className="text-indigo-600">Tech</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                  isActive(link.path)
                    ? 'text-indigo-600 bg-indigo-50/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions: Authenticated User or Login & Sign Up */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-3">
                {/* Dashboard Shortcut */}
                <Link
                  to={dashboardPath}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/super-admin')
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black uppercase overflow-hidden shrink-0">
                      {user.profilePhoto ? (
                        <img
                          src={normalizeImageUrl(user.profilePhoto) || ''}
                          alt={user.firstName || 'User'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : user.firstName ? (
                        user.firstName.charAt(0)
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">
                      {user.firstName || 'Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black uppercase overflow-hidden shrink-0">
                          {user.profilePhoto ? (
                            <img
                              src={normalizeImageUrl(user.profilePhoto) || ''}
                              alt={user.firstName || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : user.firstName ? (
                            user.firstName.charAt(0)
                          ) : (
                            <UserIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {user.firstName} {user.lastName || ''}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                            {user.role}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={dashboardPath}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Go to Dashboard</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={openLogin}
                  className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-600/25 transition-all hover:shadow-md cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  isActive(link.path)
                    ? 'text-indigo-600 bg-indigo-50 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-lg">
                  <p className="text-xs font-bold text-slate-900">{user.firstName} {user.lastName || ''}</p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                </div>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLogin();
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSignup();
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
