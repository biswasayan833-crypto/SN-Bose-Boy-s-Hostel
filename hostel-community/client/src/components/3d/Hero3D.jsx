import React, { Suspense, lazy } from 'react';

// Code-split Three.js into a dynamic chunk
const Community3DCanvas = lazy(() => import('./Community3DCanvas'));

/**
 * Hero3D
 * 
 * Lazy-loaded Three.js wrapper with graceful fallback.
 * Keeps initial bundle size optimal and prevents blocking main UI render.
 */
export const Hero3D = ({ intensity = 'normal', enableParallax = true, className = '' }) => {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-radial from-indigo-950/20 via-transparent to-transparent opacity-50 z-0"
        />
      }
    >
      <Community3DCanvas
        intensity={intensity}
        enableParallax={enableParallax}
        className={className}
      />
    </Suspense>
  );
};

export default Hero3D;
