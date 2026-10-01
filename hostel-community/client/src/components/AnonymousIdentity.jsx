import React, { useState } from 'react';
import { EyeOff, Shuffle, ShieldCheck, Lock } from 'lucide-react';

export const AnonymousIdentity = () => {
  const samplePersonas = [
    {
      name: 'Anonymous Panda',
      badge: 'Wing A • 2nd Year',
      avatar: '🐼',
      color: 'from-emerald-500 to-teal-600',
      tagline: 'Quiet observer, avid night owl',
    },
    {
      name: 'Midnight Owl',
      badge: 'Wing B • 3rd Year',
      avatar: '🦉',
      color: 'from-amber-500 to-orange-600',
      tagline: 'Hostel quad strategist & badminton enthusiast',
    },
    {
      name: 'Silent Rider',
      badge: 'Wing C • 2nd Year',
      avatar: '🏍️',
      color: 'from-indigo-500 to-violet-600',
      tagline: 'Exploring campus clubs and lab experiments',
    },
    {
      name: 'Neon Falcon',
      badge: 'Wing D • 4th Year',
      avatar: '🦅',
      color: 'from-cyan-500 to-blue-600',
      tagline: 'Placement veteran & final-year mentor',
    },
    {
      name: 'Cosmic Fox',
      badge: 'Wing A • 3rd Year',
      avatar: '🦊',
      color: 'from-purple-500 to-pink-600',
      tagline: 'Late night coding & canteen regular',
    },
    {
      name: 'Quantum Lynx',
      badge: 'Wing B • 4th Year',
      avatar: '🐆',
      color: 'from-rose-500 to-red-600',
      tagline: 'Physics and electronics enthusiast',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  const rollIdentity = () => {
    setIsRolling(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % samplePersonas.length);
      setIsRolling(false);
    }, 250);
  };

  const activePersona = samplePersonas[currentIndex];

  return (
    <section id="identity" className="py-20 md:py-28 relative bg-[#090d16]/70 border-y border-white/[0.05]">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-violet-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Conceptual explanation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              <span>Peer Privacy Protection</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Express Yourself Freely. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                Your Real Name is Not Displayed to Others.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              In college hostels, hierarchy, senior-junior dynamics, and peer pressure can hold students back from asking crucial questions, reporting issues, or sharing honest feedback.
            </p>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              At <strong className="text-white">Prof. S.N. Bose Boys Hostel</strong>, everyone is identified through randomly assigned personas like <span className="text-indigo-300 font-semibold">"Anonymous Panda"</span>, <span className="text-amber-300 font-semibold">"Midnight Owl"</span>, and <span className="text-cyan-300 font-semibold">"Silent Rider"</span>.
            </p>

            {/* Architectural Security Guarantee Box */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Dual-Tier Identity Architecture</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                  <span className="text-emerald-400 font-semibold block mb-1">✓ What Other Students See:</span>
                  Anonymous Alias, Year Badge (2nd, 3rd, or 4th Year), Masked Avatar, Public Post Content.
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/[0.04]">
                  <span className="text-violet-400 font-semibold block mb-1">🛡️ What the Server Verifies:</span>
                  Institutional Hostel Student ID (kept strictly private for security & anti-harassment).
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Persona Demo Generator */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-cyan-500/30 via-indigo-500/20 to-violet-500/40 shadow-2xl">
              <div className="bg-[#0b0f1a] rounded-2xl p-6 sm:p-8 space-y-6">
                
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                      Identity Simulator
                    </span>
                    <h3 className="text-base font-bold text-white">How You Appear in Community</h3>
                  </div>

                  <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Masked Active
                  </span>
                </div>

                {/* Simulated Identity Card */}
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${activePersona.color} p-[1px] transition-all duration-300 ${
                    isRolling ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
                  }`}
                >
                  <div className="bg-[#0e1424] rounded-2xl p-6 text-center space-y-4">
                    {/* Big Avatar */}
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
                      {activePersona.avatar}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-white tracking-tight">
                        {activePersona.name}
                      </h4>
                      <p className="text-xs font-mono text-cyan-300">
                        {activePersona.badge}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 italic">
                      "{activePersona.tagline}"
                    </p>

                    <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>True Student Identity Protected</span>
                    </div>
                  </div>
                </div>

                {/* Roll Identity Button */}
                <button
                  onClick={rollIdentity}
                  disabled={isRolling}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98]"
                >
                  <Shuffle className={`w-4 h-4 text-cyan-400 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>Cycle Persona Example</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-normal">
                  Your real name is not displayed to other students in the community.
                </p>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AnonymousIdentity;
