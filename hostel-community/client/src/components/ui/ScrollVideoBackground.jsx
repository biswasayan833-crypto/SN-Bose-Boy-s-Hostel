import React, { useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

/**
 * ScrollVideoBackground / HeroVideoBackground
 * Fixed, full-viewport HTML5 video container hosting 'hero.mp4'.
 * Strictly scoped to pre-login/unauthenticated sessions.
 *
 * Requirements:
 * - HTML5 video tag using 'hero.mp4' as source
 * - Attributes: autoplay, loop, muted, playsinline, preload="auto"
 * - Video styling: position: fixed; inset: 0; width: 100vw; height: 100vh; object-fit: cover; object-position: center; transform: scale(1.15); z-index: -1; pointer-events: none;
 * - Parent media container: position: fixed; inset: 0; width: 100vw; height: 100vh; overflow: hidden; z-index: -1; pointer-events: none;
 */
export const ScrollVideoBackground = ({
  videoSrc = '/assets/videos/hero.mp4',
  className = '',
}) => {
  const authContext = useContext(AuthContext);
  const isAuthenticated = Boolean(authContext?.isAuthenticated || authContext?.user);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isAuthenticated) {
        video.pause();
        return;
      }
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy handled gracefully
        });
      }
    }

    return () => {
      if (video) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch (e) {
          // Clean unmount
        }
      }
    };
  }, [isAuthenticated]);

  // If user is authenticated, unmount completely from DOM
  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      id="bg-video-container"
      className="bg-video-container"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      {/* 0. Fallback Base Underlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: '#080c14',
          zIndex: -2,
        }}
      />

      {/* 1. Globally Fixed Full-Viewport HTML5 Background Video */}
      <video
        ref={videoRef}
        id="bg-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={className}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: 'center',
          transform: 'scale(1.15)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* 2. Light Tint Overlay (3D details and lighting stay sharp) */}
      <div
        id="twilight-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 14, 0.18)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default ScrollVideoBackground;
