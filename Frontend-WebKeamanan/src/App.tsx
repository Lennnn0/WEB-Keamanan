import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Layouts
import { AdminLayout } from './components/layouts/AdminLayout';
import { StudentLayout } from './components/layouts/StudentLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { QuestionBankPage } from './pages/admin/QuestionBankPage';
import { ImportQuestionsPage } from './pages/admin/ImportQuestionsPage';
import { ExamManagementPage } from './pages/admin/ExamManagementPage';
import { StudyMaterialsPage } from './pages/admin/StudyMaterialsPage';
import { StudentManagementPage } from './pages/admin/StudentManagementPage';
import { SchedulesPage } from './pages/admin/SchedulesPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { AvailableExamsPage } from './pages/student/AvailableExamsPage';
import { ExamTakingPage } from './pages/student/ExamTakingPage';
import { ExamResultPage } from './pages/student/ExamResultPage';
import { StudentHistoryPage } from './pages/student/StudentHistoryPage';
import { StudentMaterialsPage } from './pages/student/StudentMaterialsPage';

// Route Guards
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Memverifikasi hak akses administrator..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Memverifikasi sesi siswa..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Memulai ExamCenter..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/student" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root Dispatcher */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="questions" element={<QuestionBankPage />} />
              <Route path="import" element={<ImportQuestionsPage />} />
              <Route path="exams" element={<ExamManagementPage />} />
              <Route path="materials" element={<StudyMaterialsPage />} />
              <Route path="students" element={<StudentManagementPage />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <StudentRoute>
                  <StudentLayout />
                </StudentRoute>
              }
            >
              <Route index element={<StudentDashboardPage />} />
              <Route path="exams" element={<AvailableExamsPage />} />
              <Route path="materials" element={<StudentMaterialsPage />} />
              <Route path="history" element={<StudentHistoryPage />} />
              <Route path="results/:attemptId" element={<ExamResultPage />} />
            </Route>

            {/* Distraction-Free Exam Taking Screen */}
            <Route
              path="/student/exams/:id/take"
              element={
                <StudentRoute>
                  <ExamTakingPage />
                </StudentRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

