import { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterState, DEFAULT_SEQUENCE_TIMING } from './constants';

const SESSION_STORAGE_KEY = 'sn_bose_character_greeted';

/**
 * useCharacterSequence
 * 
 * Reusable animation & interaction state controller for the fictional Bose Hostel Resident.
 * Orchestrates cinematic sequence transitions:
 *   walking (0.0–2.5s) → stop (2.5–3.0s) → lookVisitor (3.0–3.8s) → wave (3.8–5.0s) → idle (5.0s+)
 * 
 * Features:
 * - Configurable timing
 * - Session/mount persistence (runs once per mount/session to avoid loop re-triggers on re-render)
 * - Safe manual wave trigger (`triggerWave`)
 * - Prefers-reduced-motion graceful bypass
 * - Callbacks: onStateChange, onSequenceComplete, onGreetingComplete
 */
export function useCharacterSequence({
  autoStart = true,
  runOncePerSession = true,
  timing: customTiming = {},
  onStateChange,
  onSequenceComplete,
  onGreetingComplete,
} = {}) {
  // Merge timing configuration
  const timing = useRef({
    ...DEFAULT_SEQUENCE_TIMING,
    ...customTiming,
  }).current;

  // Reduced motion preference detection
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Determine initial state: if reduced motion or already greeted in session, start in idle
  const isAlreadyGreeted = useCallback(() => {
    if (typeof window === 'undefined' || !runOncePerSession) return false;
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }, [runOncePerSession]);

  const [currentState, setCurrentState] = useState(() => {
    if (prefersReducedMotion || isAlreadyGreeted()) {
      return CharacterState.IDLE;
    }
    return autoStart ? CharacterState.WALKING : CharacterState.IDLE;
  });

  const [previousState, setPreviousState] = useState(null);
  const [isSequenceRunning, setIsSequenceRunning] = useState(() => {
    return !prefersReducedMotion && !isAlreadyGreeted() && autoStart;
  });

  const activeTimerRef = useRef(null);
  const sequenceIndexRef = useRef(0);
  const hasInitializedRef = useRef(false);

  // Safely transition states and invoke callbacks
  const changeState = useCallback((nextState) => {
    setCurrentState((prev) => {
      if (prev === nextState) return prev;
      setPreviousState(prev);
      if (typeof onStateChange === 'function') {
        onStateChange(nextState, prev);
      }
      return nextState;
    });
  }, [onStateChange]);

  // Clear any scheduled timers
  const clearCurrentTimer = useCallback(() => {
    if (activeTimerRef.current) {
      clearTimeout(activeTimerRef.current);
      activeTimerRef.current = null;
    }
  }, []);

  // Manual wave trigger (e.g. on character click or interaction hint)
  const triggerWave = useCallback((duration = 1.4) => {
    clearCurrentTimer();
    changeState(CharacterState.WAVE);

    activeTimerRef.current = setTimeout(() => {
      changeState(CharacterState.IDLE);
    }, duration * 1000);
  }, [changeState, clearCurrentTimer]);

  // Manual state override
  const setAnimationState = useCallback((state) => {
    clearCurrentTimer();
    setIsSequenceRunning(false);
    changeState(state);
  }, [changeState, clearCurrentTimer]);

  // Main scripted sequence runner
  useEffect(() => {
    // If reduced motion is requested, immediately stabilize to idle
    if (prefersReducedMotion) {
      changeState(CharacterState.IDLE);
      setIsSequenceRunning(false);
      onGreetingComplete?.();
      onSequenceComplete?.();
      return;
    }

    // If already greeted in this session or autoStart disabled, do not re-run sequence
    if (isAlreadyGreeted() || !autoStart) {
      changeState(CharacterState.IDLE);
      setIsSequenceRunning(false);
      onGreetingComplete?.();
      onSequenceComplete?.();
      return;
    }

    // Prevent re-triggering from subsequent component re-renders
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Sequence schedule:
    // 0: walking     (0.0s - timing.walking)
    // 1: stop        (timing.walking - timing.walking + timing.stop)
    // 2: lookVisitor (timing.walking + timing.stop - + timing.lookVisitor)
    // 3: wave        (timing.walking + timing.stop + timing.lookVisitor - + timing.wave)
    // 4: idle        (after wave completes)
    const sequenceSteps = [
      { state: CharacterState.WALKING, duration: timing.walking * 1000 },
      { state: CharacterState.STOP, duration: timing.stop * 1000 },
      { state: CharacterState.LOOK_VISITOR, duration: timing.lookVisitor * 1000 },
      { state: CharacterState.WAVE, duration: timing.wave * 1000 },
    ];

    const runStep = (stepIdx) => {
      if (stepIdx >= sequenceSteps.length) {
        // Sequence has finished - settle into IDLE
        changeState(CharacterState.IDLE);
        setIsSequenceRunning(false);

        // Record session completion to prevent loops on component re-render
        if (runOncePerSession && typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
          } catch {
            // storage quota / privacy mode fallback
          }
        }

        // Fire sequence completion callbacks
        if (typeof onSequenceComplete === 'function') {
          onSequenceComplete();
        }
        if (typeof onGreetingComplete === 'function') {
          onGreetingComplete();
        }
        return;
      }

      const currentStep = sequenceSteps[stepIdx];
      changeState(currentStep.state);

      activeTimerRef.current = setTimeout(() => {
        sequenceIndexRef.current = stepIdx + 1;
        runStep(stepIdx + 1);
      }, currentStep.duration);
    };

    // Begin sequence
    setIsSequenceRunning(true);
    runStep(0);

    return () => {
      clearCurrentTimer();
    };
  }, [
    autoStart,
    timing,
    prefersReducedMotion,
    isAlreadyGreeted,
    changeState,
    clearCurrentTimer,
    onSequenceComplete,
    onGreetingComplete,
    runOncePerSession,
  ]);

  return {
    currentState,
    previousState,
    isSequenceRunning,
    isIdle: currentState === CharacterState.IDLE,
    triggerWave,
    setAnimationState,
    timing,
  };
}

export default useCharacterSequence;
