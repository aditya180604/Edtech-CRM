import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChooseRolePage } from './pages/ChooseRolePage';
import { CoursesPage } from './pages/CoursesPage';
import { TopicsPage } from './pages/TopicsPage';
import { LearningPathsPage } from './pages/LearningPathsPage';
import { InstructorsPage } from './pages/InstructorsPage';
import { WebinarsPage } from './pages/WebinarsPage';
import { CartPage } from './pages/CartPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { LearningPathDetailPage } from './pages/LearningPathDetailPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { OfferingDetailPage } from './pages/OfferingDetailPage';
import { StudentProfilePage } from './pages/StudentProfilePage';

// Role Dashboards
import { StudentDashboard } from './pages/dashboards/StudentDashboard';
import { InstructorDashboard } from './pages/dashboards/InstructorDashboard';
import { InstructorOnboardingPage } from './pages/InstructorOnboardingPage';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard';

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
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:topicId" element={<TopicDetailPage />} />
            <Route path="/learning-paths" element={<LearningPathsPage />} />
            <Route path="/learning-paths/:slug" element={<LearningPathDetailPage />} />
            <Route path="/offerings/:offeringId" element={<OfferingDetailPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/webinars" element={<WebinarsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/course/:slug" element={<CourseDetailPage />} />

            {/* Student Dashboards & Profile */}
            <Route path="/profile" element={<StudentProfilePage />} />
            <Route path="/dashboard/student/profile" element={<StudentProfilePage />} />
            <Route path="/settings" element={<StudentProfilePage />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />

            {/* Instructor Dashboards */}
            <Route path="/instructor/onboarding" element={<InstructorOnboardingPage />} />
            <Route path="/dashboard/instructor" element={<InstructorDashboard />} />
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />

            {/* Admin Dashboards */}
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Super Admin Dashboards */}
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />

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
