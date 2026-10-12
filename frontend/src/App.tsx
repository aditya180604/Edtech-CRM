import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ChooseRolePage } from './pages/ChooseRolePage';
import { CoursesPage } from './pages/CoursesPage';
import { TopicsPage } from './pages/TopicsPage';
import { LearningPathsPage } from './pages/LearningPathsPage';
import { InstructorsPage } from './pages/InstructorsPage';
import { WebinarsPage } from './pages/WebinarsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutResultPage } from './pages/CheckoutResultPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { LearningPathDetailPage } from './pages/LearningPathDetailPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { OfferingDetailPage } from './pages/OfferingDetailPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { StudentOnboardingPage } from './pages/StudentOnboardingPage';
import { LiveWebinarRoomPage } from './pages/LiveWebinarRoomPage';
import { SkillPassportPage } from './pages/SkillPassportPage';
import { MentorshipDirectoryPage } from './pages/mentorship/MentorshipDirectoryPage';

// Informational & Footer Resource Pages
import { BlogPage } from './pages/BlogPage';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { CommunityPage } from './pages/CommunityPage';
import { CareerSupportPage } from './pages/CareerSupportPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';

import { ProtectedRoute } from './components/ProtectedRoute';

// Role Dashboards
import { StudentDashboard } from './pages/dashboards/StudentDashboard';
import { InstructorDashboard } from './pages/dashboards/InstructorDashboard';
import { InstructorOnboardingPage } from './pages/InstructorOnboardingPage';
import { InstructorLobbyPage } from './pages/InstructorLobbyPage';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard';
import { SuperAdminInstructorDashboardPage } from './pages/dashboards/SuperAdminInstructorDashboardPage';

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
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
};

export default App;
