import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ScrollVideoBackground from './ScrollVideoBackground';

/**
 * Reusable CinematicBackground primitive for Hostel Website
 * Hosts the fixed, full-viewport HTML5 video container bound to window scroll
 * with soft dark gradient overlays and elevated UI content container (z-index: 1).
 *
 * NOTE: Background video is strictly scoped to unauthenticated/pre-login views.
 */
export const CinematicBackground = ({
  showGrid = false,
  showOrbs = false,
  enableVideo = false,
  videoSrc = '/assets/videos/hero.mp4',
  className = '',
  style = {},
  children,
}) => {
  const authContext = useContext(AuthContext);
  const isAuthenticated = Boolean(authContext?.isAuthenticated || authContext?.user);

  // Background video is strictly scoped to pre-login/unauthenticated pages
  const shouldRenderVideo = Boolean(enableVideo && !isAuthenticated);

  return (
    <div
      className={`relative min-h-screen bg-transparent text-slate-100 ${style?.overflow ? '' : 'overflow-x-hidden'} ${className}`}
      style={style}
    >
      {/* 1. Fixed, Full-Viewport HTML5 Video Background Container (strictly pre-login) */}
      {shouldRenderVideo && (
        <ScrollVideoBackground
          videoSrc={videoSrc}
        />
      )}

      {/* 2. Ambient Accent Glow Layers */}
      {showOrbs && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          {/* Top-Center Indigo/Violet Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-cyan-500/05 blur-[140px] animate-ambient-drift" />

          {/* Left Lateral Glow */}
          <div className="absolute top-1/3 -left-48 w-[400px] h-[400px] rounded-full bg-violet-600/08 blur-[130px]" />

          {/* Right Bottom Cyan Glow */}
          <div className="absolute bottom-12 -right-48 w-[450px] h-[450px] rounded-full bg-cyan-500/06 blur-[140px]" />
        </div>
      )}

      {/* 3. Subtle Tech Grid Layer */}
      {showGrid && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-30"
          aria-hidden="true"
        />
      )}

      {/* 4. Foreground Page Content Container elevated with z-index: 1 */}
      <div
        className="relative z-[1] flex flex-col min-h-screen"
        style={{ zIndex: 1 }}
      >
        {children}
      </div>
    </div>
  );
};

export default CinematicBackground;
