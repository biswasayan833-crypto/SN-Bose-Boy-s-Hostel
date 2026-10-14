import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Shield,
  Sparkles,
  ArrowRight,
  EyeOff,
  Lock,
  MessageSquare,
  Flame,
  Megaphone,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NoticeBoardModal } from './NoticeBoardModal';

export const Hero = ({ onOpenHowItWorks }) => {
  const [activeTab, setActiveTab] = useState('global');
  const [isNoticeBoardModalOpen, setIsNoticeBoardModalOpen] = useState(false);
  const [isLiveFeedDrawerOpen, setIsLiveFeedDrawerOpen] = useState(false);
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

  // Reusable Live Feed Card Component
  const renderLiveFeedCard = (isDrawer = false) => (
    <div
      className="rounded-2xl p-5 sm:p-6 space-y-4 transition-all"
      style={{
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(245, 158, 11, 0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Mock Window Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Hostel Live Feed
          </span>
        </div>

        {/* Room Selector Tab Switcher */}
        <div className="flex p-0.5 bg-slate-900/80 rounded-xl border border-white/[0.08] text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'global'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌍 Global
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yearRooms')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'yearRooms'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎓 Years
          </button>
        </div>
      </div>

      {/* Active Anonymity Shield Banner */}
      <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-medium">Peer Anonymity:</span>
          <span className="text-emerald-400 font-mono font-semibold">Active</span>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono font-semibold">[PROTECTED]</span>
      </div>

      {/* Message Stream */}
      <div className="space-y-3 min-h-[190px] flex flex-col justify-center">
        {mockMessages[activeTab].map((msg) => (
          <div
            key={msg.id}
            className="bg-slate-900/40 hover:bg-slate-900/70 border border-white/[0.06] rounded-xl p-3 transition-all hover:border-amber-500/30 group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-tr ${msg.avatarColor} flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-sm flex-shrink-0`}
                >
                  {msg.author.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                  {msg.author}
                </span>
                <span className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.06] flex-shrink-0">
                  {msg.badge}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{msg.time}</span>
            </div>
            <p className="text-xs text-slate-300 pl-7 leading-relaxed">
              {msg.content}
            </p>
            <div className="pl-7 pt-1.5 flex items-center gap-3.5 text-[11px] text-slate-400">
              <span className="hover:text-amber-400 cursor-pointer flex items-center gap-1 transition-colors">
                ❤️ {msg.likes}
              </span>
              <span className="hover:text-amber-400 cursor-pointer transition-colors">
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
          className="flex items-center bg-slate-900/80 border border-white/[0.08] hover:border-amber-500/40 rounded-xl px-3.5 py-2 text-xs text-slate-400 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400 mr-2 flex-shrink-0" />
          <span className="truncate">Type an anonymous thought...</span>
          <span className="ml-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors">
            Post
          </span>
        </Link>
      </div>

      {/* Clean Notice Board Quick Launcher Button */}
      <div className="pt-2.5 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={() => {
            setIsNoticeBoardModalOpen(true);
            if (isDrawer) setIsLiveFeedDrawerOpen(false);
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-400/50 transition-all text-left cursor-pointer group"
          title="Click to view full Hostel Notice Board"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
              Hostel Notice Board
            </span>
          </div>
          <span className="text-xs text-amber-300/90 font-medium group-hover:text-amber-200 transition-colors flex items-center gap-1">
            Bulletins 📋 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Cinematic Hero Viewport with Compact Bottom-Left Dock */}
      <section
        id="home"
        className="relative min-h-[90vh] sm:min-h-screen z-[1] overflow-hidden"
        style={{
          zIndex: 1,
          background: 'transparent',
        }}
      >
        {/* Compact Bottom-Left Dock (.hero-content) */}
        <div className="hero-content space-y-3 pointer-events-auto">
          {/* Main Heading with Warm Twilight Gradient */}
          <h1
            className="font-extrabold tracking-tight text-white"
            style={{
              fontSize: '1.8rem',
              lineHeight: 1.2,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
            }}
          >
            Your Hostel.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Your Voice.
            </span> <br />
            <span className="text-slate-200 font-bold">
              Your Community.
            </span>
          </h1>

          {/* Slim Horizontal Row Badges */}
          <div className="flex flex-row items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md">
              <EyeOff className="w-3 h-3 text-cyan-400" />
              Peer Anonymous
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 backdrop-blur-md">
              <Shield className="w-3 h-3 text-amber-400" />
              Hostel-Verified
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-md">
              <Lock className="w-3 h-3 text-emerald-400" />
              Year Channels
            </span>
          </div>

          {/* Action Buttons: Warm Amber Primary CTA */}
          <div className="flex flex-row items-center gap-2.5 pt-1">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="btn-cinema-primary text-xs py-2 px-4 group shadow-lg shadow-amber-500/25 justify-center"
            >
              <span>{isAuthenticated ? 'Dashboard' : 'Enter Community'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="btn-cinema-secondary text-xs py-2 px-3.5 justify-center cursor-pointer hover:border-amber-500/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>How It Works</span>
            </button>
          </div>
        </div>

        {/* Scroll Cue Below Fold */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto hidden md:block">
          <a
            href="#hostel-feed"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-slate-300 hover:text-white transition-all duration-300"
            style={{
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(245, 158, 11, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span>Explore Live Feed & Bulletins</span>
            <ChevronDown className="w-3.5 h-3.5 animate-bounce text-amber-400" />
          </a>
        </div>
      </section>

      {/* 2. Next Section Below The Fold: Dedicated Hostel Live Feed Showcase (Transparent for Persistent Video) */}
      <section
        id="hostel-feed"
        className="scroll-mt-24"
        style={{
          padding: '96px 24px',
          position: 'relative',
          zIndex: 2,
          background: 'transparent',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Hostel Town Square</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Real-Time Hostel Pulse
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Live updates, mess announcements, sports matches, and wing discussions.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {renderLiveFeedCard(false)}
          </div>
        </div>
      </section>

      {/* 3. Collapsible Floating Side Drawer/Pill for Instant Access (Portaled to document.body) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed bottom-6 right-6 z-40 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsLiveFeedDrawerOpen(!isLiveFeedDrawerOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 group"
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(245, 158, 11, 0.12)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
                title="Open Hostel Live Feed Drawer"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <Flame className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Hostel Live Feed
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-mono border border-amber-500/30">
                  POPUP
                </span>
              </button>
            </div>

            {/* Floating Slide-Over Drawer Modal */}
            {isLiveFeedDrawerOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={() => setIsLiveFeedDrawerOpen(false)}
              >
                <div
                  className="relative w-full max-w-md animate-slide-up"
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(245, 158, 11, 0.18)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    borderRadius: '1.25rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-white">Live Hostel Broadcast</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLiveFeedDrawerOpen(false)}
                      className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 max-h-[80vh] overflow-y-auto">
                    {renderLiveFeedCard(true)}
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}


      {/* Accessible DOM Notice Board Modal */}
      <NoticeBoardModal
        isOpen={isNoticeBoardModalOpen}
        onClose={() => setIsNoticeBoardModalOpen(false)}
      />
    </>
  );
};

export default Hero;
