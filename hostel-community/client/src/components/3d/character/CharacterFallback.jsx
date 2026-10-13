import React from 'react';
import { User, Sparkles } from 'lucide-react';

/**
 * CharacterFallback
 * 
 * Cinematic 2D placeholder/fallback rendered when:
 * 1. The 3D GLB model is loading or not yet supplied
 * 2. WebGL is unavailable on low-end hardware
 * 3. User prefers reduced motion / low-power mobile mode
 * 
 * Blends seamlessly with the obsidian/violet/cyan aesthetic.
 */
export const CharacterFallback = ({
  status = 'ready',
  message = 'Hostel Resident 3D Avatar',
  className = '',
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${className}`}
      aria-label="3D Hostel Resident Character Placeholder"
    >
      {/* Ambient Radial Glow Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <div className="w-56 h-72 sm:w-64 sm:h-80 rounded-full bg-gradient-to-t from-indigo-600/20 via-violet-600/15 to-cyan-500/10 blur-2xl animate-ambient-drift" />
      </div>

      {/* Stylized Character Silhouette Illustration */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Head & Persona Node */}
        <div className="relative mb-3">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-cyan-500/30 border border-indigo-400/40 p-[2px] shadow-xl shadow-indigo-600/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0e1a]/90 rounded-[22px] flex items-center justify-center text-indigo-300">
              <User className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.5] text-indigo-300" />
            </div>
          </div>

          {/* Floating Student Emblem Pill */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-400/50 shadow-md flex items-center gap-1 text-[10px] font-mono text-cyan-300 whitespace-nowrap">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            <span>S.N. Bose Student</span>
          </div>
        </div>

        {/* Torso & Backpack Silhouette Representation */}
        <div className="w-28 h-20 sm:w-32 sm:h-24 rounded-2xl bg-gradient-to-b from-indigo-900/30 to-transparent border-t border-indigo-500/20 flex flex-col items-center justify-center space-y-1">
          <div className="w-16 h-1 rounded-full bg-cyan-400/30" />
          <div className="w-10 h-1 rounded-full bg-violet-400/20" />
        </div>

        {/* Status Caption */}
        <div className="mt-4 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm max-w-xs">
          <p className="text-xs font-semibold text-slate-200 tracking-tight">
            {message}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {status === 'loading' ? 'Loading 3D asset...' : 'Rigged GLB Asset Ready for Binding'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CharacterFallback;
