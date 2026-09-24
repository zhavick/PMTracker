import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import TimesheetPage from './pages/TimesheetPage';
import AttendancePage from './pages/AttendancePage';
import CalendarPage from './pages/CalendarPage';
import NotesPage from './pages/NotesPage';
import SqlToolsPage from './pages/SqlToolsPage';
import JsonToolsPage from './pages/JsonToolsPage';
import MembersPage from './pages/MembersPage';
import MasterDataPage from './pages/MasterDataPage';
import AuditTrailPage from './pages/AuditTrailPage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import SyncPage from './pages/SyncPage';
import ProfilePage from './pages/ProfilePage';
import UserGuidePage from './pages/UserGuidePage';
import { TimerProvider } from './context/TimerContext';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return isAuthenticated ? <TimerProvider>{children}</TimerProvider> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="timesheet" element={<TimesheetPage />} />

          <Route path="attendance" element={<AttendancePage />} />
          <Route path="calendar" element={<CalendarPage />} />

          <Route path="notes" element={<NotesPage />} />

          <Route path="sql-tools" element={<SqlToolsPage />} />
          <Route path="json-tools" element={<JsonToolsPage />} />

          <Route path="members" element={<MembersPage />} />

          <Route path="master-data" element={<MasterDataPage />} />
          <Route path="audit-trail" element={<AuditTrailPage />} />
          <Route path="email-settings" element={<EmailSettingsPage />} />
          <Route path="sync" element={<SyncPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="user-guide" element={<UserGuidePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
