import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CommunityProvider } from './context/CommunityContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import AdminReports from './pages/AdminReports';
import NotFound from './pages/NotFound';


export const App = () => {
  return (
    <AuthProvider>
      <CommunityProvider>
        <Router>
          <Routes>
            {/* Public Landing Page */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <LandingPage />
                </MainLayout>
              }
            />

            {/* Public Auth Routes (Redirect to /dashboard if already signed in) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Community Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Real-Time Community Chat Room */}
            <Route
              path="/community/:slug"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Moderation Hub */}
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute>
                  <AdminReports />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Router>
      </CommunityProvider>
    </AuthProvider>
  );
};

export default App;
