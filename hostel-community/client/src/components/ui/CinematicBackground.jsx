import React, { Suspense } from 'react';
import { Hero3D } from '../3d';

/**
 * Reusable CinematicBackground primitive for Task 10 Design System
 * Creates depth, ambient cosmic/neon lighting, and subtle grid textures
 * without sacrificing readability, performance, or mobile responsiveness.
 */
export const CinematicBackground = ({
  showGrid = true,
  showOrbs = true,
  enable3D = false,
  className = '',
  children,
}) => {
  return (
    <div className={`relative min-h-screen bg-[#07090e] text-slate-100 overflow-x-hidden ${className}`}>
      {/* 1. Ambient Glow Layers (Fixed or Absolute behind content) */}
      {showOrbs && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          {/* Top-Center Indigo/Violet Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-gradient-to-tr from-indigo-600/18 via-violet-600/12 to-cyan-500/08 blur-[140px] animate-ambient-drift" />

          {/* Left Lateral Glow */}
          <div className="absolute top-1/3 -left-48 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[130px]" />

          {/* Right Bottom Cyan Glow */}
          <div className="absolute bottom-12 -right-48 w-[450px] h-[450px] rounded-full bg-cyan-500/08 blur-[140px]" />
        </div>
      )}

      {/* 2. Subtle Tech Grid Layer */}
      {showGrid && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-40"
          aria-hidden="true"
        />
      )}

      {/* 3. Ambient 3D Three.js Layer (Optional) */}
      {enable3D && (
        <Suspense fallback={null}>
          <Hero3D intensity="subtle" enableParallax={true} className="fixed" />
        </Suspense>
      )}

      {/* 4. Foreground Page Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default CinematicBackground;
