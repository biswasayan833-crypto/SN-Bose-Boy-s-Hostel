 import React, { useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, EyeOff, Lock, MessageSquare, Flame, CheckCircle2, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import Hero3D from './3d/Hero3D';
import { WelcomeSpeechBubble } from './3d/character/WelcomeSpeechBubble';
import { NoticeBoardModal } from './NoticeBoardModal';

// Code-split 3D Character Canvas
const CharacterCanvas = lazy(() => import('./3d/character/CharacterCanvas'));

export const Hero = ({ onOpenHowItWorks }) => {
  const [activeTab, setActiveTab] = useState('global');
  const [isSpeechBubbleVisible, setIsSpeechBubbleVisible] = useState(false);
  const [isNoticeBoardModalOpen, setIsNoticeBoardModalOpen] = useState(false);
  const [isNoticeBoardHighlighted, setIsNoticeBoardHighlighted] = useState(false);
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

      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-5 xl:gap-8 items-center">
          
          {/* 1. Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-4 xl:col-span-4 text-center lg:text-left space-y-6 pointer-events-auto">
            {/* Tagline Badge */}
            <div className="animate-slide-down inline-flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] sm:text-sm font-medium shadow-inner max-w-full">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-subtle-pulse flex-shrink-0" />
              <span className="font-semibold text-white">Prof. S.N. Bose Boys Hostel</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-indigo-300">Campus Student Network</span>
            </div>

            {/* Main Heading */}
            <div className="animate-fade-in stagger-1 space-y-2 sm:space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[52px] font-extrabold tracking-tight text-white leading-[1.12] break-words">
                Your Hostel. <br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  Your Voice.
                </span> <br />
                <span className="text-slate-200 font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[38px] xl:text-[44px]">
                  Your Community.
                </span>
              </h1>
            </div>

            {/* Supporting Text */}
            <p className="animate-fade-in stagger-2 text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
              An exclusive, authenticated student space for the residents of{' '}
              <strong className="text-white font-semibold">Prof. S.N. Bose Boys Hostel</strong> to connect,
              share insights, ask questions, discuss hostel life, and speak freely —{' '}
              <span className="text-cyan-300 font-medium border-b border-cyan-500/40 pb-0.5">
                with peer anonymity protecting your real name
              </span>.
            </p>

            {/* Key Trust Badges */}
            <div className="animate-slide-up stagger-3 flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
              <Badge variant="cyan" size="sm">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Real Names Kept Private</span>
              </Badge>
              <Badge variant="violet" size="sm">
                <Shield className="w-3.5 h-3.5" />
                <span>Hostel-Verified Residents</span>
              </Badge>
              <Badge variant="emerald" size="sm">
                <Lock className="w-3.5 h-3.5" />
                <span>Year Channels</span>
              </Badge>
            </div>

            {/* CTA Buttons */}
            <div className="animate-slide-up stagger-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="btn-cinema-primary w-full sm:w-auto min-h-[44px] text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 group shadow-xl shadow-indigo-600/30 justify-center"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Enter Community'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={onOpenHowItWorks}
                className="btn-cinema-secondary w-full sm:w-auto min-h-[44px] text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 justify-center cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>How It Works</span>
              </button>
            </div>
          </div>

          {/* 2. Center Column: Dedicated 3D Student Resident & Notice Board Visual Space */}
          <div className="hidden md:flex flex-col items-center justify-center relative lg:col-span-4 xl:col-span-5 h-[480px] lg:h-[540px] xl:h-[580px] pointer-events-auto select-none">
            <div className="w-full h-full relative">
              <Suspense fallback={null}>
                <CharacterCanvas
                  enableInteraction={true}
                  isNoticeBoardHighlighted={isNoticeBoardHighlighted}
                  onOpenNoticeBoard={() => setIsNoticeBoardModalOpen(true)}
                  onGreetingComplete={() => {
                    setIsSpeechBubbleVisible(true);
                    setIsNoticeBoardHighlighted(true);
                  }}
                />
              </Suspense>

              {/* Welcome Speech Bubble Anchored to Character Stage */}
              <div className="absolute top-2 left-2 sm:left-4 z-30 pointer-events-none">
                <WelcomeSpeechBubble
                  isVisible={isSpeechBubbleVisible}
                  onDismiss={() => {
                    setIsSpeechBubbleVisible(false);
                    setIsNoticeBoardHighlighted(false);
                  }}
                  onOpenNoticeBoard={() => {
                    setIsNoticeBoardModalOpen(true);
                    setIsSpeechBubbleVisible(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Right Column: Hostel Live Feed Card with Subtle Glass & Clean Notice Board Launcher */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 pointer-events-auto">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div
                className="rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl border border-white/[0.08]"
                style={{
                  background: 'rgba(10, 15, 30, 0.42)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                
                {/* Mock Window Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
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
                  <div className="flex p-0.5 bg-slate-900/90 rounded-xl border border-white/[0.08] text-[10px] font-medium">
                    <button
                      onClick={() => setActiveTab('global')}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        activeTab === 'global'
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🌍 Global
                    </button>
                    <button
                      onClick={() => setActiveTab('yearRooms')}
                      className={`px-2 py-0.5 rounded-lg transition-all ${
                        activeTab === 'yearRooms'
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🎓 Years
                    </button>
                  </div>
                </div>

                {/* Active Anonymity Shield Banner */}
                <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900/80 border border-violet-500/20 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-300 font-medium">Peer Anonymity:</span>
                    <span className="text-emerald-400 font-mono font-semibold">Active</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">[HIDDEN]</span>
                </div>

                {/* Message Stream */}
                <div className="space-y-2.5 min-h-[220px] flex flex-col justify-center">
                  {mockMessages[activeTab].map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-slate-900/50 hover:bg-slate-900/80 border border-white/[0.06] rounded-xl p-2.5 sm:p-3 transition-all hover:border-indigo-500/30 group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-tr ${msg.avatarColor} flex items-center justify-center text-[9px] font-bold text-slate-950 shadow-sm flex-shrink-0`}
                          >
                            {msg.author.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                            {msg.author}
                          </span>
                          <span className="text-[9px] bg-slate-800/80 text-slate-400 px-1 py-0.2 rounded border border-white/[0.06] flex-shrink-0">
                            {msg.badge}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">{msg.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                        {msg.content}
                      </p>
                      <div className="pl-6 pt-1 flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 transition-colors">
                          ❤️ {msg.likes}
                        </span>
                        <span className="hover:text-indigo-400 cursor-pointer transition-colors">
                          Reply
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock Input Bar */}
                <div className="relative pt-0.5">
                  <Link
                    to={isAuthenticated ? '/dashboard' : '/register'}
                    className="flex items-center bg-slate-900/90 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:border-indigo-500/40 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400 mr-2 flex-shrink-0" />
                    <span className="truncate">Type an anonymous thought...</span>
                    <span className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg transition-colors">
                      Post
                    </span>
                  </Link>
                </div>

                {/* Cleanly Docked Notice Board Quick Launcher (No Floating Overlap) */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsNoticeBoardModalOpen(true)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/30 hover:border-cyan-400/60 transition-all text-left cursor-pointer group pointer-events-auto"
                    title="Click to view full Hostel Notice Board"
                  >
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        Hostel Notice Board
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-200 transition-colors flex items-center gap-1">
                      View Bulletins 📋 <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Accessible DOM Notice Board Modal */}
      <NoticeBoardModal
        isOpen={isNoticeBoardModalOpen}
        onClose={() => setIsNoticeBoardModalOpen(false)}
      />
    </section>
  );
};

export default Hero;
