import React from 'react';
import { Check } from 'lucide-react';

export const PREDEFINED_AVATARS = [
  { id: 'avatar-01', icon: '🦅', name: 'Falcon', label: 'Avatar 1' },
  { id: 'avatar-02', icon: '🐺', name: 'Wolf', label: 'Avatar 2' },
  { id: 'avatar-03', icon: '🐯', name: 'Tiger', label: 'Avatar 3' },
  { id: 'avatar-04', icon: '🦊', name: 'Fox', label: 'Avatar 4' },
  { id: 'avatar-05', icon: '🦉', name: 'Owl', label: 'Avatar 5' },
  { id: 'avatar-06', icon: '🐼', name: 'Panda', label: 'Avatar 6' },
  { id: 'avatar-07', icon: '🐆', name: 'Panther', label: 'Avatar 7' },
  { id: 'avatar-08', icon: '🐻', name: 'Bear', label: 'Avatar 8' },
];

/**
 * Returns the emoji icon for an avatar ID or returns the string if already an icon.
 */
export const getAvatarDisplay = (avatarKey) => {
  if (!avatarKey) return '🎭';
  const cleanKey = String(avatarKey).trim();
  const match = PREDEFINED_AVATARS.find(
    (a) => a.id.toLowerCase() === cleanKey.toLowerCase() || a.icon === cleanKey
  );
  if (match) return match.icon;
  // Guard: Never display raw internal avatar IDs (e.g. 'avatar-01', 'avatar-02') as text
  if (/^avatar[-\s_]?\d+/i.test(cleanKey)) {
    return '🎭';
  }
  return cleanKey;
};

export const AvatarPicker = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Choose your community avatar
        </label>
        <span className="text-[11px] font-mono text-indigo-400">
          Predefined Hostel Personas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {PREDEFINED_AVATARS.map((avatar) => {
          const isSelected = selectedAvatar === avatar.id || selectedAvatar === avatar.icon;

          return (
            <button
              type="button"
              key={avatar.id}
              onClick={() => onSelect(avatar.id)}
              className={`relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl border transition-all duration-200 text-left group cursor-pointer min-h-[48px] ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-500/80 scale-[1.02]'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.06]'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isSelected
                    ? 'bg-indigo-500/25 border border-indigo-400/50 shadow-inner'
                    : 'bg-white/[0.04] border border-white/[0.06]'
                }`}
              >
                {avatar.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white tracking-tight truncate">
                  {avatar.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {avatar.label}
                </div>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-indigo-500/50">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarPicker;
