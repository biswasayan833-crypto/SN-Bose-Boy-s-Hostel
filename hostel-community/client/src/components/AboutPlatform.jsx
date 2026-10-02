import React from 'react';
import { ShieldAlert, Cpu, HeartHandshake, CheckCircle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

export const AboutPlatform = () => {
  return (
    <section id="about" className="py-20 md:py-28 relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Emblem & Physics Heritage */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard variant="elevated" glow={true} className="p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] flex items-center justify-center shadow-lg flex-shrink-0">
                    <div className="w-full h-full bg-[#080d19] rounded-[15px] flex items-center justify-center">
                      <Cpu className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                      Prof. S.N. Bose
                    </h3>
                    <p className="text-xs text-indigo-300 font-mono truncate">
                      Theoretical Physicist & Visionary
                    </p>
                  </div>
                </div>

                <blockquote className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-indigo-500/60 pl-4 py-1 leading-relaxed">
                  "Named in honor of Satyendra Nath Bose, our hostel represents intellect, resilience, and unity. This digital platform mirrors that spirit — providing every resident a modern voice."
                </blockquote>

                <div className="space-y-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Dedicated solely to Prof. S.N. Bose Boys Hostel</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Engineered with modern full-stack MERN architecture</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Safe from external university surveillance or public crawlers</span>
                  </div>
                </div>
              </div>

            </GlassCard>
          </div>

          {/* Right Column: Platform Purpose & Security Principles */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="violet" size="md">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Platform Mission</span>
            </Badge>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              A Safe, Respectful Space Designed For Honest Hostel Camaraderie
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Living in a boys hostel is one of the most transformative phases of university life. However, critical issues — whether it’s requesting quiet hours, asking candid academic guidance from seniors, or addressing mess hygiene — are often left unspoken due to social awkwardness or fear of being singled out.
            </p>

            {/* Architecture Principle Callout Box */}
            <GlassCard variant="default" className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Our Core Architecture Principle</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The platform guarantees <strong>100% peer anonymity</strong> across all chat rooms and posts. At the same time, the backend maintains secure, private institutional identity records. This prevents malicious abuse, trolling, or harassment while giving honest students complete psychological freedom to communicate openly.
              </p>
            </GlassCard>

            <p className="text-xs sm:text-sm text-slate-400">
              Prof. S.N. Bose Boys Hostel Community is an evolving ecosystem with real-time socket communications, multimedia sharing, polls, and announcements.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutPlatform;
