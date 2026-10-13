import React, { useEffect, useCallback } from 'react';
import { Sparkles, Megaphone, Check, X, Shield } from 'lucide-react';

/**
 * WelcomeSpeechBubble
 * 
 * Cinematic glassmorphic speech bubble that appears when onGreetingComplete() fires.
 * Seamlessly integrates with the Prof. S.N. Bose dark obsidian, cyan, and violet aesthetic.
 * 
 * Accessibility & Safety:
 * - Dismissible via Escape key or Close button
 * - Non-blocking: pointer-events-auto on the card only, doesn't interfere with Hero CTAs
 * - Respects prefers-reduced-motion: instantaneous appearance without spring animations
 */
export function WelcomeSpeechBubble({
  isVisible = false,
  onDismiss,
  onOpenNoticeBoard,
  className = '',
}) {
  // Keyboard Escape listener to dismiss
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isVisible) {
        onDismiss?.();
      }
    },
    [isVisible, onDismiss]
  );

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  if (!isVisible) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Resident Welcome Message"
      className={`relative z-20 pointer-events-auto max-w-[340px] sm:max-w-[380px] p-4 sm:p-5 rounded-2xl glass-panel-deep border border-indigo-500/35 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl animate-scale-in text-left select-none transition-all duration-300 ${className}`}
    >
      {/* Speech Bubble Glowing Pointer Arrow / Tail (pointing toward student head) */}
      <div
        className="hidden md:block absolute -right-2 top-8 w-4 h-4 bg-slate-900 border-t border-r border-indigo-500/35 transform rotate-45 pointer-events-none"
        aria-hidden="true"
      />

      {/* Header with Resident Identity & Dismiss Button */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          {/* Avatar Dot */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-indigo-600/30">
            319
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              Hostel Resident
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Room 319
              </span>
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
          title="Dismiss welcome message"
          aria-label="Dismiss welcome message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Content */}
      <div className="pt-3 pb-2 space-y-2">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 leading-snug">
          Welcome to Prof. S.N. Bose Boys Hostel! 👋
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          I'm 319, your fellow resident. Feel free to explore our anonymous student network, check out the live community feed, or tap the <strong className="text-cyan-300 font-semibold">Notice Board</strong> behind me for official hostel bulletins!
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            onOpenNoticeBoard?.();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
        >
          <Megaphone className="w-3.5 h-3.5 text-cyan-300" />
          <span>Open Notice Board</span>
        </button>

        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition-all cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Got it</span>
        </button>
      </div>
    </aside>
  );
}

export default WelcomeSpeechBubble;
