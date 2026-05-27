import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/shared/Sidebar';
import Header from './components/shared/Header';
import MobileNav from './components/shared/MobileNav';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages — carregadas sob demanda (code splitting) para reduzir o bundle inicial
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TasksPage = lazy(() => import('./pages/Tasks'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const FinancePage = lazy(() => import('./pages/Finance'));
const HabitsPage = lazy(() => import('./pages/Habits'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const GymPage = lazy(() => import('./pages/Gym'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const MenstrualCyclePage = lazy(() => import('./pages/MenstrualCycle'));
const Paywall = lazy(() => import('./pages/Paywall'));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#c1ff72]">
    Loading...
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, profile, loading } = useAuth();

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
  const isStandalonePage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/onboarding' || location.pathname === '/paywall';

  if (isStandalonePage) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/paywall" element={<Paywall />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 px-4 lg:px-10 max-w-[1600px] w-full mx-auto pt-2 pb-24 lg:pb-10">
          <ErrorBoundary pageName="App">
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
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
