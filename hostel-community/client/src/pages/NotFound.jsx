import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Shield } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Shield className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white">404</h1>
          <h2 className="text-xl font-bold text-slate-200">Room Not Found</h2>
          <p className="text-sm text-slate-400">
            The community channel or page you are looking for does not exist in Prof. S.N. Bose Boys Hostel network.
          </p>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Hostel Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
