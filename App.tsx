import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';
import MobileNav from './components/shared/MobileNav';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';

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
import MenstrualCyclePage from './pages/MenstrualCycle';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#c1ff72]">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center text-[#c1ff72]">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isStandalonePage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/onboarding';

  if (isStandalonePage) {
    return (
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 px-4 lg:px-10 max-w-[1600px] w-full mx-auto pt-2 pb-24 lg:pb-10">
          <ErrorBoundary pageName="App">
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary pageName="Dashboard"><Dashboard /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><ErrorBoundary pageName="Tasks"><TasksPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><ErrorBoundary pageName="Projects"><ProjectsPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute><ErrorBoundary pageName="Finance"><FinancePage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/habits" element={<ProtectedRoute><ErrorBoundary pageName="Habits"><HabitsPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><ErrorBoundary pageName="Calendar"><CalendarPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><ErrorBoundary pageName="Settings"><SettingsPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/gym" element={<ProtectedRoute><ErrorBoundary pageName="Gym"><GymPage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ErrorBoundary pageName="Profile"><ProfilePage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/cycle" element={<ProtectedRoute><ErrorBoundary pageName="MenstrualCycle"><MenstrualCyclePage /></ErrorBoundary></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
