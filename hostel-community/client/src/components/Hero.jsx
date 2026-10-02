import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, EyeOff, Lock, MessageSquare, Flame, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Hero3D } from './3d';

export const Hero = ({ onOpenHowItWorks }) => {
  const [activeTab, setActiveTab] = useState('global');
  const { isAuthenticated } = useAuth();

  const mockMessages = {
    global: [
      {
        id: 1,
        author: 'Midnight Owl',
        badge: 'Wing B • 3rd Year',
        avatarColor: 'from-amber-400 to-orange-500',
        content: 'Is anyone up for late-night badminton in the quad? Court 2 is free right now.',
        time: '2 mins ago',
        likes: 7,
      },
      {
        id: 2,
        author: 'Anonymous Panda',
        badge: 'Wing A • 2nd Year',
        avatarColor: 'from-emerald-400 to-teal-500',
        content: 'Mess update: Special dinner today has paneer butter masala and gulab jamun! 🍲',
        time: '8 mins ago',
        likes: 24,
      },
      {
        id: 3,
        author: 'Silent Rider',
        badge: 'Wing C • 4th Year',
        avatarColor: 'from-violet-400 to-indigo-500',
        content: 'Does anyone have a spare scientific calculator for the morning physics exam?',
        time: '14 mins ago',
        likes: 4,
      },
    ],
    yearRooms: [
      {
        id: 4,
        author: 'Quiet Wolf',
        badge: '2nd Year',
        avatarColor: 'from-cyan-400 to-blue-500',
        content: 'Which professor is coordinating the Data Structures lab evaluations this sem?',
        time: '5 mins ago',
        likes: 9,
      },
      {
        id: 5,
        author: 'Senior Guide',
        badge: '4th Year',
        avatarColor: 'from-purple-400 to-pink-500',
        content: '3rd floor reading room after 11 PM is dead silent. Pro tip: grab a window seat early.',
        time: 'Just now',
        likes: 18,
      },
    ],
  };

  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Three.js 3D Connected Community Lattice Layer */}
      <Hero3D intensity="normal" enableParallax={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-7">
            {/* Tagline Badge */}
            <div className="animate-slide-down inline-flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] sm:text-sm font-medium shadow-inner max-w-full">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-subtle-pulse flex-shrink-0" />
              <span className="font-semibold text-white">Prof. S.N. Bose Boys Hostel</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-indigo-300">Campus Student Network</span>
            </div>

            {/* Main Heading */}
            <div className="animate-fade-in stagger-1 space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[66px] font-extrabold tracking-tight text-white leading-[1.1] break-words">
                Your Hostel. <br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Your Voice.
                </span> <br />
                <span className="text-slate-200 font-bold text-2xl sm:text-4xl md:text-5xl lg:text-[52px]">
                  Your Community.
                </span>
              </h1>
            </div>

            {/* Supporting Text */}
            <p className="animate-fade-in stagger-2 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              An exclusive, authenticated student space for the residents of{' '}
              <strong className="text-white font-semibold">Prof. S.N. Bose Boys Hostel</strong> to connect,
              share insights, ask questions, discuss hostel life, and speak freely —{' '}
              <span className="text-cyan-300 font-medium border-b border-cyan-500/40 pb-0.5">
                with peer anonymity protecting your real name
              </span>.
            </p>

            {/* Key Trust Badges */}
            <div className="animate-slide-up stagger-3 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
              <Badge variant="cyan" size="md">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Real Names Kept Private</span>
              </Badge>
              <Badge variant="violet" size="md">
                <Shield className="w-3.5 h-3.5" />
                <span>Hostel-Verified Residents</span>
              </Badge>
              <Badge variant="emerald" size="md">
                <Lock className="w-3.5 h-3.5" />
                <span>2nd, 3rd & 4th Year Channels</span>
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="animate-slide-up stagger-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="btn-cinema-primary w-full sm:w-auto min-h-[46px] text-sm sm:text-base py-3 sm:py-3.5 px-6 sm:px-8 group shadow-xl shadow-indigo-600/30 justify-center"
              >
                <span>{isAuthenticated ? 'Go to Community Dashboard' : 'Enter the Community'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={onOpenHowItWorks}
                className="btn-cinema-secondary w-full sm:w-auto min-h-[46px] text-sm sm:text-base py-3 sm:py-3.5 px-6 sm:px-7 justify-center cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Mock Community Interaction Widget */}
          <div className="lg:col-span-5 animate-scale-in stagger-2">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <GlassCard variant="elevated" glow={true} className="p-4 sm:p-6 space-y-4">
                
                {/* Mock Window Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <div className="h-4 w-[1px] bg-slate-800" />
                    <span className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      Hostel Live Feed
                    </span>
                  </div>

                  {/* Room Selector Tab Switcher */}
                  <div className="flex p-0.5 bg-slate-900/90 rounded-xl border border-white/[0.08] text-[11px] font-medium">
                    <button
                      onClick={() => setActiveTab('global')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        activeTab === 'global'
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🌍 Global
                    </button>
                    <button
                      onClick={() => setActiveTab('yearRooms')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        activeTab === 'yearRooms'
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🎓 Year Rooms
                    </button>
                  </div>
                </div>

                {/* Active Anonymity Shield Banner */}
                <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900/80 border border-violet-500/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300 font-medium">Peer Anonymity:</span>
                    <span className="text-emerald-400 font-mono font-semibold">Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Real Name: [HIDDEN]</span>
                </div>

                {/* Message Stream */}
                <div className="space-y-3 min-h-[260px] flex flex-col justify-center">
                  {mockMessages[activeTab].map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-slate-900/50 hover:bg-slate-900/80 border border-white/[0.06] rounded-xl p-3.5 transition-all hover:border-indigo-500/30 group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-tr ${msg.avatarColor} flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-sm flex-shrink-0`}
                          >
                            {msg.author.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                            {msg.author}
                          </span>
                          <span className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.06] flex-shrink-0">
                            {msg.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{msg.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                        {msg.content}
                      </p>
                      <div className="pl-8 pt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 transition-colors">
                          ❤️ {msg.likes}
                        </span>
                        <span className="hover:text-indigo-400 cursor-pointer transition-colors">
                          Reply anonymously
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock Input Bar */}
                <div className="relative pt-1">
                  <Link
                    to={isAuthenticated ? '/dashboard' : '/register'}
                    className="flex items-center bg-slate-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-400 hover:border-indigo-500/40 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-400 mr-2 flex-shrink-0" />
                    <span className="truncate">Type an anonymous hostel thought...</span>
                    <span className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors">
                      Post
                    </span>
                  </Link>
                </div>

              </GlassCard>

              {/* Decorative Floating Pill */}
              <div className="hidden sm:flex absolute -bottom-4 -left-6 glass-panel-deep rounded-xl px-3.5 py-2 items-center gap-2.5 shadow-xl border border-violet-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">
                  Real names are not displayed to other students
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
