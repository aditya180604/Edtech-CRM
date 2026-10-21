import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthModal } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';

// Keep critical Landing Page eagerly loaded for instant First Contentful Paint (FCP)
import { HomePage } from './pages/HomePage';

// Lazy-loaded routes for code splitting and dramatically reduced initial JS payload
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const ChooseRolePage = lazy(() => import('./pages/ChooseRolePage').then((m) => ({ default: m.ChooseRolePage })));
const CoursesPage = lazy(() => import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage })));
const TopicsPage = lazy(() => import('./pages/TopicsPage').then((m) => ({ default: m.TopicsPage })));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage').then((m) => ({ default: m.TopicDetailPage })));
const LearningPathsPage = lazy(() => import('./pages/LearningPathsPage').then((m) => ({ default: m.LearningPathsPage })));
const LearningPathDetailPage = lazy(() => import('./pages/LearningPathDetailPage').then((m) => ({ default: m.LearningPathDetailPage })));
const OfferingDetailPage = lazy(() => import('./pages/OfferingDetailPage').then((m) => ({ default: m.OfferingDetailPage })));
const InstructorsPage = lazy(() => import('./pages/InstructorsPage').then((m) => ({ default: m.InstructorsPage })));
const MentorshipDirectoryPage = lazy(() => import('./pages/mentorship/MentorshipDirectoryPage').then((m) => ({ default: m.MentorshipDirectoryPage })));
const WebinarsPage = lazy(() => import('./pages/WebinarsPage').then((m) => ({ default: m.WebinarsPage })));
const WebinarLobbyPage = lazy(() => import('./pages/WebinarLobbyPage').then((m) => ({ default: m.WebinarLobbyPage })));
const LiveWebinarRoomPage = lazy(() => import('./pages/LiveWebinarRoomPage').then((m) => ({ default: m.LiveWebinarRoomPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CheckoutResultPage = lazy(() => import('./pages/CheckoutResultPage').then((m) => ({ default: m.CheckoutResultPage })));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })));

// Informational & Footer Resource Pages
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const CareerSupportPage = lazy(() => import('./pages/CareerSupportPage').then((m) => ({ default: m.CareerSupportPage })));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage').then((m) => ({ default: m.AboutUsPage })));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage').then((m) => ({ default: m.ContactUsPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));

// Role Dashboards & Onboarding
const StudentOnboardingPage = lazy(() => import('./pages/StudentOnboardingPage').then((m) => ({ default: m.StudentOnboardingPage })));
const StudentDashboard = lazy(() => import('./pages/dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
const SkillPassportPage = lazy(() => import('./pages/SkillPassportPage').then((m) => ({ default: m.SkillPassportPage })));
const InstructorOnboardingPage = lazy(() => import('./pages/InstructorOnboardingPage').then((m) => ({ default: m.InstructorOnboardingPage })));
const InstructorLobbyPage = lazy(() => import('./pages/InstructorLobbyPage').then((m) => ({ default: m.InstructorLobbyPage })));
const InstructorDashboard = lazy(() => import('./pages/dashboards/InstructorDashboard').then((m) => ({ default: m.InstructorDashboard })));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const SuperAdminDashboard = lazy(() => import('./pages/dashboards/SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard })));
const SuperAdminInstructorDashboardPage = lazy(() => import('./pages/dashboards/SuperAdminInstructorDashboardPage').then((m) => ({ default: m.SuperAdminInstructorDashboardPage })));

/**
 * Non-blocking, smooth route transition placeholder
 */
const PageLoader: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16">
    <div className="w-8 h-8 border-3 border-slate-200 border-t-[#FA5A36] rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-400">Loading page...</span>
  </div>
);

const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading, getRedirectPathForRole } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  const redirectPath = getRedirectPathForRole(user.role, user.isProfileCompleted, user.instructorId);
  return <Navigate to={redirectPath} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <CartProvider>
          <ToastProvider>
            <BrowserRouter>
              {/* Global Auth Popup Modal */}
              <AuthModal />

              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Marketplace & Info */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<RegisterPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/choose-role" element={<ChooseRolePage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/topics" element={<TopicsPage />} />
                  <Route path="/topics/:topicId" element={<TopicDetailPage />} />
                  <Route path="/learning-paths" element={<LearningPathsPage />} />
                  <Route path="/learning-paths/:slug" element={<LearningPathDetailPage />} />
                  <Route path="/offerings/:offeringId" element={<OfferingDetailPage />} />
                  <Route path="/instructors" element={<InstructorsPage />} />
                  <Route path="/mentorship" element={<MentorshipDirectoryPage />} />
                  <Route path="/webinars" element={<WebinarsPage />} />
                  <Route path="/webinars/lobby/:roomCode" element={<WebinarLobbyPage />} />
                  <Route path="/webinars/live/:roomCode" element={<LiveWebinarRoomPage />} />
                  <Route path="/webinar/live/:roomCode" element={<LiveWebinarRoomPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout/result" element={<CheckoutResultPage />} />
                  <Route path="/course/:slug" element={<CourseDetailPage />} />
                  <Route path="/courses/:slug" element={<CourseDetailPage />} />

                  {/* Informational & Footer Resource Pages */}
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/help" element={<HelpCenterPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/career-support" element={<CareerSupportPage />} />
                  <Route path="/about" element={<AboutUsPage />} />
                  <Route path="/contact" element={<ContactUsPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />

                  {/* Student Dashboards & Profile (Protected) */}
                  <Route
                    path="/student/onboarding"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/complete-profile"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/student/profile"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={<DashboardRedirect />}
                  />
                  <Route
                    path="/dashboard/student"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Verified Skill Passport */}
                  <Route path="/passport/:identifier" element={<SkillPassportPage />} />
                  <Route path="/passport" element={<SkillPassportPage />} />

                  {/* Instructor Dashboards & Verification Lobby (Protected) */}
                  <Route
                    path="/instructor/onboarding"
                    element={
                      <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
                        <InstructorOnboardingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructor/pending-verification"
                    element={
                      <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
                        <InstructorLobbyPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructor/lobby"
                    element={
                      <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
                        <InstructorLobbyPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/instructor/:instructorId"
                    element={
                      <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']}>
                        <InstructorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/instructor"
                    element={<DashboardRedirect />}
                  />
                  <Route
                    path="/instructor/dashboard"
                    element={<DashboardRedirect />}
                  />

                  {/* Admin Dashboards (Protected) */}
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Super Admin Dashboards (Protected) */}
                  <Route
                    path="/super-admin"
                    element={
                      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/super-admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/super-admin/instructor/:instructorId"
                    element={
                      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                        <SuperAdminInstructorDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
};

export default App;
