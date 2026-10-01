import React from 'react';
import { Award, ShieldAlert, Cpu, HeartHandshake, CheckCircle } from 'lucide-react';

export const AboutPlatform = () => {
  return (
    <section id="about" className="py-20 md:py-28 relative bg-[#090d16]/80 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Emblem & Physics Heritage */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-cyan-950/40 border border-white/[0.1] p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] flex items-center justify-center shadow-lg">
                    <div className="w-full h-full bg-[#0d1222] rounded-[15px] flex items-center justify-center">
                      <Cpu className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Prof. S.N. Bose
                    </h3>
                    <p className="text-xs text-indigo-300 font-mono">
                      Theoretical Physicist & Visionary
                    </p>
                  </div>
                </div>

                <blockquote className="text-sm text-slate-300 italic border-l-2 border-indigo-500/60 pl-4 py-1 leading-relaxed">
                  "Named in honor of Satyendra Nath Bose, our hostel represents intellect, resilience, and unity. This digital platform mirrors that spirit — providing every resident a modern voice."
                </blockquote>

                <div className="space-y-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Dedicated solely to Prof. S.N. Bose Boys Hostel</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Engineered with modern MERN stack architecture</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Safe from external university surveillance or public crawlers</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Platform Purpose & Security Principles */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5 text-violet-400" />
              <span>Platform Mission</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              A Safe, Respectful Space Designed For Honest Hostel Camaraderie
            </h2>

            <p className="text-base text-slate-300 leading-relaxed">
              Living in a boys hostel is one of the most transformative phases of university life. However, critical issues — whether it’s requesting quiet hours, asking candid academic guidance from seniors, or addressing mess hygiene — are often left unspoken due to social awkwardness or fear of being singled out.
            </p>

            {/* Architecture Principle Callout Box */}
            <div className="rounded-2xl bg-slate-900/90 border border-indigo-500/20 p-6 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Our Core Architecture Principle</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                The platform guarantees <strong>100% peer anonymity</strong> across all chat rooms and posts. At the same time, the backend maintains secure, private institutional identity records. This prevents malicious abuse, trolling, or harassment while giving honest students complete psychological freedom to communicate openly.
              </p>
            </div>

            <p className="text-sm text-slate-400">
              Prof. S.N. Bose Boys Hostel Community is an evolving ecosystem. Step 1 establishes our scalable MERN infrastructure and design language; authentication and live real-time messaging will be rolled out in subsequent stages.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutPlatform;
