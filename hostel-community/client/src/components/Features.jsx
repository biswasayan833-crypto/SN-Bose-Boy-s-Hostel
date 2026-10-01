import React from 'react';
import { EyeOff, Layers, Globe2, ShieldCheck, MessageSquareCode, Zap, Sparkles } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: EyeOff,
      title: 'Anonymous Conversations',
      description:
        'Every message you post is masked with an anonymous handle. Share thoughts, ask queries, and debate campus issues freely without fear of judgment.',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Layers,
      title: 'Year-Wise Dedicated Rooms',
      description:
        'Separate partitioned spaces for 1st, 2nd, 3rd, and 4th years so discussions remain relevant to your academic and hostel phase.',
      color: 'from-violet-500 to-indigo-500',
    },
    {
      icon: Globe2,
      title: 'Global Hostel Town Square',
      description:
        'A single common channel uniting all wings of Prof. S.N. Bose Boys Hostel for mess feedback, sports tournaments, festival planning, and announcements.',
      color: 'from-blue-500 to-teal-500',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Private Community',
      description:
        'Only verified residents of S.N. Bose Hostel can access the network. Outside college students cannot view or participate in hostel deliberations.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: MessageSquareCode,
      title: 'Student Q&A & Support',
      description:
        'Borrow lab kits, find exam partners, exchange notes, get senior roadmap advice, and report broken amenities rapidly.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Future Real-Time Messaging',
      description:
        'Engineered from the ground up for lightning-speed Socket.IO live socket streams, real-time reactions, and instant notifications.',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built For Hostel Life</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Features Tailored For Student Harmony
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            A thoughtful blend of privacy, peer connection, and hostel camaraderie crafted specifically for the residents of Prof. S.N. Bose Boys Hostel.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 border border-white/[0.07] hover:border-indigo-500/40 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/40"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-[1px] mb-5 flex items-center justify-center`}
                >
                  <div className="w-full h-full bg-[#0a0f1d] rounded-[11px] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-2.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Features;
