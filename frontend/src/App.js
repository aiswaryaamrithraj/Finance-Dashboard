// src/App.js
// The root component. Sets up routing and protects pages based on auth/role.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar        from './components/layout/Sidebar';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import RecordsPage   from './pages/RecordsPage';
import UsersPage     from './pages/UsersPage';
import './index.css';

// ── Protected Route ────────────────────────────────────────────────────────────
// Wraps pages that require authentication. If not logged in, redirect to /login.
// Optionally requires a specific role (e.g. 'admin').
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ── App Shell ──────────────────────────────────────────────────────────────────
// Wraps authenticated pages with the sidebar layout
function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* Protected routes — any authenticated user */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell><DashboardPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/records" element={
        <ProtectedRoute>
          <AppShell><RecordsPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Admin-only route */}
      <Route path="/users" element={
        <ProtectedRoute requiredRole="admin">
          <AppShell><UsersPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,       // suppresses the startTransition warning
          v7_relativeSplatPath: true,     // suppresses the splat path warning
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
