import React, {
  useRef,
  useState,
  useEffect,
  Suspense,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { StudentCharacter } from './StudentCharacter';
import { CharacterFallback } from './CharacterFallback';
import { NoticeBoard3D } from './NoticeBoard3D';
import { HostelDeskSetup } from './HostelDeskSetup';
import { useCharacterSequence } from './useCharacterSequence';
import { CharacterState } from './constants';

/**
 * Checks if WebGL is supported by the client browser.
 */
function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * CharacterLighting
 * 
 * Cinematic studio lighting setup tailored for the Prof. S.N. Bose resident character:
 * 1. Warm/cool ambient fill to prevent dark clipping
 * 2. High-intensity front key light angled to illuminate facial details and "319" hoodie print
 * 3. Electric cyan rim light for striking edge silhouette
 * 4. Rich violet hair & shoulder backlight to separate dark wavy hair from background
 * 5. Gentle upward bounce light for natural clothing folds
 */
function CharacterLighting() {
  return (
    <>
      {/* Soft Ambient Fill */}
      <ambientLight color="#dbeafe" intensity={0.9} />

      {/* Front Key Light (Aimed at face and upper torso) */}
      <directionalLight
        position={[0.6, 2.2, 3.8]}
        intensity={1.9}
        color="#ffffff"
        castShadow
      />

      {/* Back-Left Electric Cyan Rim Light */}
      <directionalLight
        position={[-3.6, 3.2, -2.5]}
        intensity={2.8}
        color="#38bdf8"
      />

      {/* Back-Right Violet Hair & Silhouette Accent Light */}
      <directionalLight
        position={[3.4, 3.0, -2.2]}
        intensity={2.2}
        color="#c084fc"
      />

      {/* Front-Fill Light (Softens harsh facial shadows) */}
      <directionalLight
        position={[-1.2, 0.8, 2.5]}
        intensity={0.65}
        color="#e0e7ff"
      />

      {/* Subtle Ground/Under Bounce */}
      <pointLight
        position={[0, -1.8, 1.8]}
        intensity={0.5}
        color="#818cf8"
        distance={6}
      />
    </>
  );
}

/**
 * CharacterCanvas
 * 
 * Isolated React Three Fiber Canvas for the fictional 3D hostel resident character.
 * Operates independently from the existing constellation Hero3D canvas.
 * 
 * Performance & Accessibility:
 * - DPR clamped to max 1.4 on mobile, 1.75 on desktop
 * - IntersectionObserver pauses frameloop when scrolled out of view
 * - Page Visibility pauses frameloop when browser tab is inactive
 * - Prefers-reduced-motion compliance
 * - Transparent alpha background
 * - Graceful 2D fallback on non-WebGL devices
 */
export const CharacterCanvas = forwardRef(function CharacterCanvas(
  {
    animationState: controlledAnimationState,
    onAnimationComplete,
    onStateChange,
    onSequenceComplete,
    onGreetingComplete,
    onCharacterClick,
    onOpenNoticeBoard,
    isNoticeBoardHighlighted = false,
    timing,
    autoStart = true,
    runOncePerSession = true,
    enableInteraction = true,
    modelPath = '/models/bose_student.glb',
    className = '',
    style = {},
  },
  ref
) {
  const containerRef = useRef(null);
  const [webGLAvailable] = useState(() => isWebGLSupported());
  const [isVisible, setIsVisible] = useState(true);
  const [isTabActive, setIsTabActive] = useState(!document.hidden);
  const [isMobile, setIsMobile] = useState(false);

  // Animation & Interaction Sequence Controller
  const {
    currentState: sequenceState,
    triggerWave,
    setAnimationState,
    isSequenceRunning,
    isIdle,
  } = useCharacterSequence({
    autoStart: controlledAnimationState ? false : autoStart,
    runOncePerSession,
    timing,
    onStateChange,
    onSequenceComplete,
    onGreetingComplete,
  });

  // Effective animation state (controlled prop takes priority if passed)
  const activeAnimationState = controlledAnimationState || sequenceState;

  // Expose imperative controller methods via ref
  useImperativeHandle(ref, () => ({
    triggerWave,
    setAnimationState,
    currentState: activeAnimationState,
    isSequenceRunning,
    isIdle,
  }), [triggerWave, setAnimationState, activeAnimationState, isSequenceRunning, isIdle]);

  // Handle character click: fire external handler and trigger friendly wave if idle
  const handleCharacterClick = () => {
    if (typeof onCharacterClick === 'function') {
      onCharacterClick();
    }
    // Always trigger wave gesture on click if not already running a special sequence
    if (activeAnimationState === CharacterState.IDLE) {
      triggerWave(1.4);
    }
  };

  // 1. Detect screen size for DPR & positioning
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. IntersectionObserver to pause rendering when offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          setIsVisible(entries[0].isIntersecting);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // 3. Page Visibility API to pause rendering when tab is inactive
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Render graceful 2D fallback if WebGL is unavailable
  if (!webGLAvailable) {
    return (
      <div ref={containerRef} className={`relative ${className}`} style={style}>
        <CharacterFallback status="ready" message="3D Resident Avatar" />
      </div>
    );
  }

  // Frameloop is paused when offscreen or tab is hidden
  const frameloop = isVisible && isTabActive ? 'always' : 'never';
  const dpr = isMobile ? [1, 1.4] : [1, 1.75];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[320px] select-none ${className}`}
      style={style}
    >
      <Suspense fallback={<CharacterFallback status="loading" />}>
        <Canvas
          frameloop={frameloop}
          dpr={dpr}
          camera={{ position: [0, 0.22, 4.3], fov: 43 }}
          gl={{
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0); // Transparent canvas background
          }}
          style={{ pointerEvents: enableInteraction ? 'auto' : 'none' }}
        >
          {/* Cinematic Lighting */}
          <CharacterLighting />

          {/* Physical 3D Interactive Notice Board */}
          <NoticeBoard3D
            position={[-1.25, 0.18, -0.4]}
            rotation={[0, 0.32, 0]}
            scale={isMobile ? 0.78 : 0.92}
            isHighlighted={isNoticeBoardHighlighted}
            onOpenNoticeBoard={onOpenNoticeBoard}
            enableInteraction={enableInteraction}
          />

          {/* Student Character Component */}
          <StudentCharacter
            modelPath={modelPath}
            animationState={activeAnimationState}
            onAnimationComplete={onAnimationComplete}
            onCharacterClick={handleCharacterClick}
            enableInteraction={enableInteraction}
            scale={isMobile ? 0.92 : 1.05}
            position={[0.18, -0.18, 0]}
          />

          {/* Stylized Study Desk with Glowing Workstation Monitor */}
          <HostelDeskSetup
            position={[0.18, -0.74, 0.42]}
            rotation={[0, -0.06, 0]}
            scale={isMobile ? 0.88 : 0.98}
          />
        </Canvas>
      </Suspense>
    </div>
  );
});

export default CharacterCanvas;
