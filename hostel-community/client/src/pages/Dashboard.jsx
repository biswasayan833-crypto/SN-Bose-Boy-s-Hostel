import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  LogOut,
  Globe,
  GraduationCap,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Lock,
  ExternalLink,
} from 'lucide-react';


import { useAuth } from '../context/AuthContext';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { getRooms } from '../services/roomService';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { online } = useHealthCheck();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [accessibleRooms, setAccessibleRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await getRooms();
        if (res?.data?.rooms) {
          setAccessibleRooms(res.data.rooms);
        }
      } catch (err) {
        setRoomsError(err.message || 'Failed to load community rooms.');
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Authenticated Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#080b12]/90 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-md shadow-indigo-600/20">
                <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  Prof. S.N. Bose
                </span>
                <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
                  Boys Hostel Community
                </span>
              </div>
            </Link>

            {/* Navigation Links for Authenticated Students */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
              <Link
                to="/dashboard"
                className="text-white hover:text-indigo-300 transition-colors flex items-center gap-1.5"
              >
                <span>Dashboard</span>
              </Link>
              <a
                href="#rooms"
                className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Community Channels</span>
              </a>
              <button
                onClick={() => setIdentityModalOpen(true)}
                className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>My Identity</span>
              </button>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/reports"
                  className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 font-bold"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Moderation</span>
                </Link>
              )}
            </nav>


            {/* Right Action Menu: Health Status + Anonymous Profile Menu */}
            <div className="flex items-center gap-3">
              
              {/* API Heartbeat Pulse */}
              <div
                className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                  online
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
                title="Backend API Connection"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{online ? 'API Online' : 'Connecting'}</span>
              </div>

              {/* Profile / Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg shadow-sm">
                    {user?.anonymousAvatar || '🎭'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {user?.anonymousName || 'Anonymous Student'}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300">
                      {user?.year}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#0c101d] border border-white/[0.1] rounded-2xl shadow-2xl p-4 space-y-4 z-50 animate-in fade-in slide-in-from-top-2">
                    
                    {/* Header in menu */}
                    <div className="border-b border-white/[0.08] pb-3 space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{user?.anonymousAvatar || '🎭'}</span>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {user?.anonymousName}
                          </div>
                          <div className="text-xs font-mono text-indigo-400">
                            {user?.year} Resident
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Community Identity:</span>
                        <span className="font-semibold text-white">Masked Persona</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Account Status:</span>
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified Resident
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-white/[0.05] text-[11px] text-slate-400 leading-relaxed">
                        🛡️ Your real name is not displayed to other students in the community.
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-1.5">
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/reports"
                          onClick={() => setMenuOpen(false)}
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            <span>Moderation Hub</span>
                          </span>
                          <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
                            Admin
                          </span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setIdentityModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between text-left"
                      >
                        <span>View My Identity Card</span>
                        <span>🎭</span>
                      </button>

                      <Link
                        to="/"
                        onClick={() => setMenuOpen(false)}
                        className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
                      >
                        <span>Hostel Landing Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors flex items-center gap-2 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Community</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Welcome Hub Banner */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-r from-violet-600/40 via-indigo-500/30 to-cyan-500/40 shadow-2xl">
          <div className="bg-[#0b0f1a]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                  Hostel Community Hub
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <span>Welcome back, {user?.anonymousName}</span>
                  <span>{user?.anonymousAvatar}</span>
                </h1>
                <p className="text-sm text-slate-300">
                  Prof. S.N. Bose Boys Hostel •{' '}
                  <strong className="text-white font-semibold">{user?.year} Resident</strong>
                </p>
              </div>

              {/* Identity Snapshot Card */}
              <div className="flex-shrink-0 flex items-center gap-3 bg-slate-900/90 border border-indigo-500/30 px-5 py-3 rounded-2xl shadow-inner">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl">
                  {user?.anonymousAvatar || '🎭'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{user?.anonymousName}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">● Active</span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">{user?.year}</div>
                  <div className="text-[10px] text-slate-400">Real name hidden from peers</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                Task 4 Active: Message reactions, self-deletion, and community safety reporting enabled!
              </span>
            </div>

          </div>
        </div>

        {/* Admin Moderation Callout (Only visible for admin role) */}
        {user?.role === 'admin' && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Hostel Moderation & Safety Center</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                    Admin Clearance
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Review student reports, moderate flagged messages, and maintain hostel conduct standards.
                </p>
              </div>
            </div>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex-shrink-0"
            >
              <span>Open Moderation Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Accessible Channels Section */}
        <div id="rooms" className="space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Your Community Channels</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Authorized rooms for your academic year. Enter a channel to chat anonymously in real time.
              </p>
            </div>
            <span className="text-xs font-mono text-indigo-400">
              {accessibleRooms.length} Channels Authorized
            </span>
          </div>

          {/* Loading state */}
          {loadingRooms && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error state */}
          {roomsError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {roomsError}
            </div>
          )}

          {/* Room Cards Grid (Displays ONLY accessible rooms for this user!) */}
          {!loadingRooms && !roomsError && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accessibleRooms.map((room) => {
                const isGlobal = room.type === 'global';

                return (
                  <div
                    key={room._id}
                    onClick={() => navigate(`/community/${room.slug}`)}
                    className="group relative cursor-pointer rounded-2xl p-6 sm:p-7 bg-slate-900/50 hover:bg-slate-900/90 border border-white/[0.09] hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-950/40 flex flex-col justify-between"
                  >
                    {/* Top Accent Gradient Bar */}
                    <div
                      className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${
                        isGlobal ? 'from-blue-500 to-cyan-500' : 'from-violet-500 to-indigo-500'
                      } opacity-0 group-hover:opacity-100 transition-opacity rounded-full`}
                    />

                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                              isGlobal ? 'from-blue-600 to-cyan-600' : 'from-violet-600 to-indigo-600'
                            } p-[1px] flex items-center justify-center flex-shrink-0`}
                          >
                            <div className="w-full h-full bg-[#0a0f1d] rounded-[11px] flex items-center justify-center">
                              {isGlobal ? (
                                <Globe className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                              ) : (
                                <GraduationCap className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {room.name}
                            </h3>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                isGlobal
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                              }`}
                            >
                              {isGlobal ? 'Everyone in Prof. S.N. Bose Boys Hostel' : `Private room for ${room.allowedYear} students`}
                            </span>
                          </div>
                        </div>

                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live Chat</span>
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-300 leading-relaxed min-h-[44px]">
                        {room.description}
                      </p>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Real Name Hidden</span>
                      </span>

                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all">
                        <span>Enter Chat Room</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Academic Year Enforcement Informational Card */}
          <div className="rounded-2xl bg-slate-900/40 border border-white/[0.05] p-5 sm:p-6 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Hostel Year Partitioning Architecture</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Prof. S.N. Bose Boys Hostel operates channels for <strong>2nd Year</strong>, <strong>3rd Year</strong>, and <strong>4th Year</strong> residents. In accordance with hostel privacy policies, your dashboard only presents the channels you are authorized to participate in.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
              <span>● Your Verified Year: <strong className="text-indigo-300">{user?.year}</strong></span>
              <span className="text-slate-600">|</span>
              <span>● Anonymous Identity: <strong className="text-cyan-300">{user?.anonymousName}</strong></span>
            </div>
          </div>

        </div>

      </main>

      {/* Identity Card Modal */}
      {identityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0c101d] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{user?.anonymousAvatar}</span>
                <div>
                  <h3 className="text-base font-bold text-white">My Community Identity</h3>
                  <p className="text-xs text-slate-400">Prof. S.N. Bose Boys Hostel</p>
                </div>
              </div>
              <button
                onClick={() => setIdentityModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
                {user?.anonymousAvatar}
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">{user?.anonymousName}</h4>
                <p className="text-xs font-mono text-cyan-300">{user?.year} Resident</p>
              </div>
              <p className="text-xs text-slate-300 italic">
                "Your real name is not displayed to other students in any room or live chat."
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIdentityModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated Footer */}
      <footer className="border-t border-white/[0.06] bg-[#070a12] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Prof. S.N. Bose Boys Hostel Community • Step 3: Real-Time Chat Active</span>
          <span className="font-mono text-slate-400">Connected as {user?.anonymousName}</span>
        </div>
      </footer>

    </div>
  );
};

export default Dashboard;
