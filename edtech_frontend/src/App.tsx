import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <BrowserRouter>
          {/* Global Auth Popup Modal */}
          <AuthModal />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<RegisterPage />} />
            <Route path="/choose-role" element={<ChooseRolePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/learning-paths" element={<LearningPathsPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/webinars" element={<WebinarsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/course/:slug" element={<CourseDetailPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </AuthModalProvider>
    </AuthProvider>
  );
};

export default App;
