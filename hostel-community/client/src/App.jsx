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
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import AdminReports from './pages/AdminReports';
import AdminAnnouncements from './pages/AdminAnnouncements';
import SearchPage from './pages/SearchPage';
import NotFound from './pages/NotFound';
import { PageTransition } from './components/ui';

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
                  <PageTransition>
                    <LandingPage />
                  </PageTransition>
                </MainLayout>
              }
            />

            {/* Public Auth Routes (Redirect to /dashboard if already signed in) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <PageTransition>
                    <Login />
                  </PageTransition>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <PageTransition>
                    <Register />
                  </PageTransition>
                </PublicRoute>
              }
            />

            {/* Protected Community Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Protected Profile & Identity Management */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ProfilePage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Protected Real-Time Community Chat Room */}
            <Route
              path="/community/:slug"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ChatPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Protected Community Search & Discovery Hub */}
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <SearchPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Moderation Hub */}
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <AdminReports />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Announcements & Polls Management */}
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <AdminAnnouncements />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <PageTransition>
                  <NotFound />
                </PageTransition>
              }
            />

          </Routes>
        </Router>
      </CommunityProvider>
    </AuthProvider>
  );
};

export default App;
