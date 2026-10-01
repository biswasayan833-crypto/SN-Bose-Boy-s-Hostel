import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, EyeOff, Lock, MessageSquare, Flame, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      {/* Background ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/15 to-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-7">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-semibold text-white">Prof. S.N. Bose Boys Hostel</span>
              <span className="text-slate-500">•</span>
              <span className="text-indigo-300">Exclusive Campus Platform</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-white leading-[1.08]">
                Your Hostel. <br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Your Voice.
                </span> <br />
                <span className="text-slate-300 font-bold text-3xl sm:text-5xl lg:text-[54px]">
                  Your Community.
                </span>
              </h1>
            </div>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              A private space for the students of{' '}
              <strong className="text-white font-semibold">Prof. S.N. Bose Boys Hostel</strong> to connect,
              share thoughts, ask questions, discuss hostel life, and speak freely —{' '}
              <span className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-4 font-medium">
                without revealing their real names to other students
              </span>.
            </p>

            {/* Key Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <EyeOff className="w-4 h-4 text-cyan-400" />
                <span>Real Names Kept Private</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>Hostel-Verified Residents</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>2nd, 3rd & 4th Year Channels</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
              >
                <span>{isAuthenticated ? 'Go to Community Dashboard' : 'Enter the Community'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={onOpenHowItWorks}
                className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-medium text-slate-300 hover:text-white bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/80 transition-all flex items-center justify-center gap-2.5 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Mock Community Interaction Widget */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-indigo-500/40 via-violet-500/20 to-cyan-500/30 shadow-2xl shadow-indigo-950/40">
                <div className="bg-[#0c101d]/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 space-y-4">
                  
                  {/* Mock Window Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                        <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                      </div>
                      <div className="h-4 w-[1px] bg-slate-800" />
                      <span className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        Hostel Live Feed
                      </span>
                    </div>

                    {/* Room Selector Tab Switcher */}
                    <div className="flex p-0.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] font-medium">
                      <button
                        onClick={() => setActiveTab('global')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          activeTab === 'global'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🌍 Global
                      </button>
                      <button
                        onClick={() => setActiveTab('yearRooms')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          activeTab === 'yearRooms'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🎓 Year Rooms
                      </button>
                    </div>
                  </div>

                  {/* Active Anonymity Shield Banner */}
                  <div className="bg-gradient-to-r from-violet-950/40 to-slate-900/80 border border-violet-800/30 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
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
                        className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.06] rounded-xl p-3.5 transition-all hover:border-indigo-500/30 group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${msg.avatarColor} flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-sm`}
                            >
                              {msg.author.charAt(0)}
                            </div>
                            <span className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {msg.author}
                            </span>
                            <span className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60">
                              {msg.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
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
                      className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 hover:border-indigo-500/40 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400 mr-2 flex-shrink-0" />
                      <span className="truncate">Type an anonymous hostel thought...</span>
                      <span className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors">
                        Post
                      </span>
                    </Link>
                  </div>

                </div>
              </div>

              {/* Decorative Floating Pill */}
              <div className="hidden sm:flex absolute -bottom-4 -left-6 bg-slate-900/90 border border-violet-500/30 rounded-xl px-3.5 py-2 items-center gap-2.5 shadow-xl backdrop-blur-md">
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
