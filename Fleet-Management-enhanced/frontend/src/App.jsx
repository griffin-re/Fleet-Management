import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { socketService } from './services/socket';
import { authService } from './services/api';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FleetPage } from './pages/FleetPage';
import { ConvoysPage } from './pages/ConvoysPage';
import {
  AlertsPage,
  MessagesPage,
  AnalyticsPage,
  SettingsPage,
  NotFoundPage,
} from './pages/PlaceholderPages';

// Components
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  const { setAuthState, isAuthenticated, token } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setAuthState(user, savedToken);

          // Connect socket
          socketService.connect(savedToken);
        } catch (error) {
          console.error('Auth init failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    initAuth();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/fleet" element={<ProtectedRoute><FleetPage /></ProtectedRoute>} />
          <Route path="/convoys" element={<ProtectedRoute><ConvoysPage /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requiredRoles={['admin', 'dispatcher']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161B22',
            color: '#e0e0e0',
            border: '1px solid #30363D',
            borderRadius: '8px',
          },
        }}
      />
    </>
  );
}

export default App;
