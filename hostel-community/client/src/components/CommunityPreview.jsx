import React from 'react';
import { Globe, GraduationCap, Users, Shield, Sparkles, ChevronRight, Hash } from 'lucide-react';

export const CommunityPreview = ({ onSelectRoom }) => {
  const rooms = [
    {
      id: 'global',
      name: 'Global Room',
      icon: Globe,
      accent: 'from-blue-500 to-cyan-500',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      tag: '🌍 Everyone in the Hostel',
      description:
        'The main town square for Prof. S.N. Bose Boys Hostel. Discuss mess menus, sports events, late-night tea plans, and common room discussions.',
      topicPreview: '"Who is organising the cricket tournament in the quad this weekend?"',
      stats: 'Open to All Residents',
    },
    {
      id: 'year-2',
      name: '2nd Year Room',
      icon: GraduationCap,
      accent: 'from-indigo-500 to-violet-500',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      tag: '🎓 2nd-Year Community',
      description:
        'Core curriculum discussions, college clubs, hackathon scouting, and early internship roadmap discussions among second-year hostelers.',
      topicPreview: '"Looking for a frontend developer for the upcoming campus hackathon team."',
      stats: '2nd Year Dedicated',
    },
    {
      id: 'year-3',
      name: '3rd Year Room',
      icon: GraduationCap,
      accent: 'from-purple-500 to-pink-500',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      tag: '🎓 3rd-Year Community',
      description:
        'Placement prep, internship experiences, interview questions, GATE/CAT resources, and pre-final year project partner collaborations.',
      topicPreview: '"Shared DSA sheet and OS notes in the resource thread for placement drives."',
      stats: '3rd Year Dedicated',
    },
    {
      id: 'year-4',
      name: '4th Year Room',
      icon: GraduationCap,
      accent: 'from-amber-500 to-orange-500',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      tag: '🎓 4th-Year Community',
      description:
        'Capstone projects, senior advice, farewell preparations, job offer negotiation insights, and final year hostel memories.',
      topicPreview: '"Final year batch t-shirt design poll is open for voting till Friday!"',
      stats: '4th Year Dedicated',
    },
  ];

  return (
    <section id="community" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>Hostel Community Channels</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Curated Rooms for Every Year
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            From hostel-wide discussions in the Global Room to year-specific academic rooms (2nd, 3rd, and 4th Year).
            <span className="text-indigo-400 font-semibold block mt-1">
              Your real name is not displayed to other students in any room.
            </span>
          </p>
        </div>

        {/* Room Grid: 4 Dedicated Rooms */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rooms.map((room) => {
            const Icon = room.icon;
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="group relative cursor-pointer rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/50 flex flex-col justify-between"
              >
                {/* Glow accent bar on hover */}
                <div
                  className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${room.accent} opacity-0 group-hover:opacity-100 transition-opacity rounded-full`}
                />

                <div className="space-y-4">
                  {/* Top Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${room.accent} p-[1px] flex items-center justify-center flex-shrink-0`}
                    >
                      <div className="w-full h-full bg-[#0d1322] rounded-[11px] flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {room.name}
                      </h3>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${room.badgeBg}`}>
                        {room.tag}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 leading-relaxed min-h-[64px]">
                    {room.description}
                  </p>

                  {/* Live Topic Snippet */}
                  <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                      <Hash className="w-3 h-3 text-indigo-400" />
                      <span>Trending Conversation:</span>
                    </div>
                    <p className="text-xs text-slate-200 italic line-clamp-2">
                      {room.topicPreview}
                    </p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-5 mt-5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px] text-slate-300">Name Hidden</span>
                  </div>

                  <span className="inline-flex items-center gap-1 font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>Enter Room</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default CommunityPreview;
