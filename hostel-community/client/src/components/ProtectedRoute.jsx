import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-[1px] shadow-lg shadow-indigo-600/30 animate-pulse">
          <div className="w-full h-full bg-[#0a0f1d] rounded-[15px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
        <p className="text-xs font-mono tracking-wider text-slate-400 uppercase">
          Verifying hostel credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
