import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { GlassCard, CinematicBackground } from '../components/ui';

export const NotFound = () => {
  return (
    <CinematicBackground intensity="subtle">
      <div className="min-h-screen flex items-center justify-center p-3.5 sm:p-4">
        <GlassCard variant="elevated" glow="accent" className="max-w-md w-full text-center space-y-5 sm:space-y-6 p-5 sm:p-8 border-indigo-500/30 shadow-2xl animate-scale-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/20">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              404
            </h1>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Room Not Found</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The community channel or page you are looking for does not exist in the Prof. S.N. Bose Boys Hostel network.
            </p>
          </div>

          <div>
            <Link
              to="/"
              className="btn-cinema-primary inline-flex text-xs min-h-[44px] items-center justify-center w-full sm:w-auto px-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Hostel Home</span>
            </Link>
          </div>
        </GlassCard>
      </div>
    </CinematicBackground>
  );
};

export default NotFound;
