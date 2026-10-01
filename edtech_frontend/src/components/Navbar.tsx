import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, Crown, ShieldCheck, Briefcase, LogOut, LayoutDashboard, Compass, ShoppingCart } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

import { webinarsApi } from '../api/webinars';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin, openSignup } = useAuthModal();
  const { user, isAuthenticated, logout, getRedirectPathForRole } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUpcomingWebinars, setHasUpcomingWebinars] = useState<boolean>(false);

  // Check for active / scheduled upcoming webinars
  React.useEffect(() => {
    let isMounted = true;
    const checkUpcomingWebinars = async () => {
      try {
        const res = await webinarsApi.getUpcomingWebinars();
        if (isMounted && res.success && res.data) {
          setHasUpcomingWebinars(!!res.data.hasUpcoming);
        }
      } catch (err) {
        if (isMounted) setHasUpcomingWebinars(false);
      }
    };

    checkUpcomingWebinars();

    // Re-check when instructor adds/deletes webinars
    const onWebinarsChanged = () => checkUpcomingWebinars();
    window.addEventListener('webinarsChanged', onWebinarsChanged);
    window.addEventListener('storage', onWebinarsChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('webinarsChanged', onWebinarsChanged);
      window.removeEventListener('storage', onWebinarsChanged);
    };
  }, []);

  const publicNavLinks = [
    { name: 'Courses', path: '/courses' },
    { name: 'Topics', path: '/topics' },
    { name: 'Learning Paths', path: '/learning-paths' },
    { name: 'Instructors', path: '/instructors' },
    ...(hasUpcomingWebinars ? [{ name: 'Webinars', path: '/webinars' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardPath = user ? getRedirectPathForRole(user.role) : '/';

  // Get Role details for badge
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'Super Admin',
          icon: Crown,
          bg: 'bg-amber-500/15 text-amber-700 border-amber-300',
        };
      case 'ADMIN':
        return {
          label: 'Admin',
          icon: ShieldCheck,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'INSTRUCTOR':
        return {
          label: 'Instructor',
          icon: Briefcase,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'STUDENT':
      default:
        return {
          label: 'Student',
          icon: GraduationCap,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;
  const RoleIcon = roleInfo?.icon;
  const userInitials =
    user?.firstName || user?.lastName
      ? `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
      : 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 sm:gap-6">
          {/* Logo with Graduation Cap */}
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

          {/* Restored Main Navigation Links (Requirement 1) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-3">
            {publicNavLinks.map((link) => (
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

          {/* Right Actions: Cart Icon, Authenticated Profile OR Guest Login/Signup */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dynamic Cart Icon Link */}
            <Link
              to="/cart"
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
                  {itemCount}
                </span>
              )}
            </Link>

            {!isAuthenticated ? (
              /* Guest Actions: Login & Sign Up */
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
            ) : (
              /* Authenticated User Profile Badge & Logout */
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {userInitials}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.firstName || 'User'} {user?.lastName || ''}
                    </p>
                    {roleInfo && RoleIcon && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md border ${roleInfo.bg}`}>
                        <RoleIcon className="w-2.5 h-2.5" />
                        {roleInfo.label}
                      </span>
                    )}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
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
          {!isAuthenticated ? (
            /* Guest Mobile Menu */
            <>
              <div className="flex flex-col space-y-1">
                {publicNavLinks.map((link) => (
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
              </div>
            </>
          ) : (
            /* Logged-In Mobile Menu */
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {user?.firstName || 'User'} {user?.lastName || ''}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  {roleInfo && RoleIcon && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-md border ${roleInfo.bg}`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleInfo.label} Portal
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>My Dashboard</span>
                </Link>
                <Link
                  to="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Courses</span>
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
