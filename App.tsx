import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';
import MobileNav from './components/shared/MobileNav';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

// Pages
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/Tasks';
import ProjectsPage from './pages/Projects';
import FinancePage from './pages/Finance';
import HabitsPage from './pages/Habits';
import CalendarPage from './pages/Calendar';
import SettingsPage from './pages/Settings';
import GymPage from './pages/Gym';
import Onboarding from './pages/Onboarding';
import ProfilePage from './pages/Profile';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-[#c1ff72]">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isStandalonePage = location.pathname === '/login' || location.pathname === '/onboarding';

  if (isStandalonePage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 px-4 lg:px-10 max-w-[1600px] w-full mx-auto pt-2 pb-24 lg:pb-10">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
            <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/gym" element={<ProtectedRoute><GymPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
