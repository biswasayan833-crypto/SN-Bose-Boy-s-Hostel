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
  User,
  Megaphone,
  BarChart2,
  Search,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { getRooms, getUnreadRooms } from '../services/roomService';
import announcementService from '../services/announcementService';
import pollService from '../services/pollService';
import socketService from '../services/socketService';
import NotificationDropdown from '../components/NotificationDropdown';
import AnnouncementCard from '../components/AnnouncementCard';
import PollCard from '../components/PollCard';
import { getAvatarDisplay } from '../components/AvatarPicker';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { CinematicBackground } from '../components/ui/CinematicBackground';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { online } = useHealthCheck();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [accessibleRooms, setAccessibleRooms] = useState([]);
  const [roomUnreads, setRoomUnreads] = useState({});
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState('');

  const [announcements, setAnnouncements] = useState([]);
  const [polls, setPolls] = useState([]);

  const fetchUnreadCounts = async () => {
    try {
      const res = await getUnreadRooms();
      if (res?.data?.unread) {
        setRoomUnreads(res.data.unread);
      }
    } catch {
      // Ignore
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await announcementService.getAnnouncements({ limit: 10 });
      if (res?.data?.announcements) {
        setAnnouncements(res.data.announcements);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchPolls = async () => {
    try {
      setLoadingPolls(true);
      const res = await pollService.getPolls({ limit: 10 });
      if (res?.data?.polls) {
        setPolls(res.data.polls);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingPolls(false);
    }
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        setRoomsError('');
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
    fetchUnreadCounts();
    fetchAnnouncements();
    fetchPolls();

    // Listen for real-time events over socket
    socketService.connect();
    const unsubUnread = socketService.onRoomUnreadUpdated(() => {
      fetchUnreadCounts();
    });

    const unsubNewMsg = socketService.onNewMessage(() => {
      fetchUnreadCounts();
    });

    const unsubAnnounceNew = socketService.onAnnouncementNew((newAnnounce) => {
      setAnnouncements((prev) => [newAnnounce, ...prev.filter((a) => a.id !== newAnnounce.id)]);
    });

    const unsubAnnounceUpd = socketService.onAnnouncementUpdated((updAnnounce) => {
      setAnnouncements((prev) => prev.map((a) => (a.id === updAnnounce.id ? updAnnounce : a)));
    });

    const unsubAnnounceDel = socketService.onAnnouncementDeleted(({ id }) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    });

    const unsubPollNew = socketService.onPollNew((newPoll) => {
      setPolls((prev) => [newPoll, ...prev.filter((p) => p.id !== newPoll.id)]);
    });

    const unsubPollUpd = socketService.onPollUpdated((updPoll) => {
      setPolls((prev) => prev.map((p) => (p.id === updPoll.id ? { ...p, ...updPoll } : p)));
    });

    const unsubPollClosed = socketService.onPollClosed((closedPoll) => {
      setPolls((prev) => prev.map((p) => (p.id === closedPoll.id ? { ...p, isClosed: true } : p)));
    });

    return () => {
      if (typeof unsubUnread === 'function') unsubUnread();
      if (typeof unsubNewMsg === 'function') unsubNewMsg();
      if (typeof unsubAnnounceNew === 'function') unsubAnnounceNew();
      if (typeof unsubAnnounceUpd === 'function') unsubAnnounceUpd();
      if (typeof unsubAnnounceDel === 'function') unsubAnnounceDel();
      if (typeof unsubPollNew === 'function') unsubPollNew();
      if (typeof unsubPollUpd === 'function') unsubPollUpd();
      if (typeof unsubPollClosed === 'function') unsubPollClosed();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <CinematicBackground className="selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Authenticated Navigation Bar */}
      <header className="sticky top-0 z-40 glass-panel-deep border-b border-white/[0.08] shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group focus-ring rounded-xl">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-600/25">
                <div className="w-full h-full bg-[#080d19] rounded-[11px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight group-hover:text-indigo-200 transition-colors">
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

            {/* Right Action Menu: Health Status + Notifications + Anonymous Profile Menu */}
            <div className="flex items-center gap-3">
              {/* Search & Discovery Quick Link */}
              <Link
                to="/search"
                className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-sm"
                title="Search & Discovery"
              >
                <Search className="w-4 h-4 text-indigo-400" />
              </Link>

              {/* Notifications Dropdown */}
              <NotificationDropdown />

              {/* API Heartbeat Pulse */}
              <Badge variant={online ? 'emerald' : 'amber'} size="sm" dot={true} className="hidden sm:inline-flex">
                {online ? 'API Online' : 'Connecting'}
              </Badge>

              {/* Profile / Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/90 border border-white/[0.1] hover:border-indigo-500/50 transition-all text-left group max-w-[200px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                    {getAvatarDisplay(user?.anonymousAvatar)}
                  </div>
                  <div className="hidden sm:flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-indigo-200">
                      {user?.anonymousName || 'Anonymous'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {user?.year}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <GlassCard
                    variant="elevated"
                    glow={true}
                    className="absolute right-0 mt-2 w-72 p-4 shadow-2xl space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    
                    {/* User Identity Info */}
                    <div className="border-b border-white/[0.08] pb-3 space-y-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                          {getAvatarDisplay(user?.anonymousAvatar)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate" title={user?.anonymousName}>
                            {user?.anonymousName}
                          </div>
                          <div className="text-xs font-mono text-indigo-400 truncate">
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
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
                        🛡️ Your real name is not displayed to other students in the community.
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-1.5">
                      {user?.role === 'admin' && (
                        <>
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
                          <Link
                            to="/admin/announcements"
                            onClick={() => setMenuOpen(false)}
                            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 transition-colors flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Announcements & Polls</span>
                            </span>
                            <span className="text-[10px] font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300">
                              Admin
                            </span>
                          </Link>
                        </>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-between text-left"
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>My Profile & Settings</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </Link>

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

                  </GlassCard>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Welcome Hub Banner */}
        <GlassCard variant="elevated" glow={true} className="p-5 sm:p-8 md:p-10 space-y-4 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0 flex-1">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Hostel Community Hub
              </span>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-2 sm:gap-3 break-words">
                <span className="min-w-0 max-w-full">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-cyan-200">{user?.anonymousName || 'Hostel Resident'}</span>
                </span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 border border-indigo-500/20 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0 shadow-sm">
                  {getAvatarDisplay(user?.anonymousAvatar)}
                </div>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Prof. S.N. Bose Boys Hostel •{' '}
                <strong className="text-white font-semibold">{user?.year} Resident</strong>
              </p>
            </div>

            {/* Identity Snapshot Card */}
            <div className="w-full sm:w-auto min-w-0 max-w-full sm:max-w-xs md:max-w-sm flex items-center gap-3.5 bg-slate-900/90 border border-indigo-500/30 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-inner flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                {getAvatarDisplay(user?.anonymousAvatar)}
              </div>
              <div className="min-w-0 flex-1 text-left space-y-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-white truncate" title={user?.anonymousName}>
                    {user?.anonymousName}
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] flex-shrink-0">
                    ● Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block text-[11px] text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                    {user?.year}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    Community Identity
                  </span>
                </div>
                <div>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors pt-0.5"
                  >
                    <span>Edit Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              Profile and anonymous identity protection active. Real names remain hidden to peers.
            </span>
          </div>
        </GlassCard>

        {/* Admin Center Callout (Only visible for admin role) */}
        {user?.role === 'admin' && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Hostel Administration Center</span>
                  <Badge variant="amber" size="sm">
                    Admin Clearance
                  </Badge>
                </h3>
                <p className="text-xs text-slate-300">
                  Manage announcements, community polls, message moderation, and hostel safety.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                to="/admin/announcements"
                className="btn-cinema-primary text-xs py-2 px-3.5 shadow-md flex-shrink-0"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Announcements & Polls</span>
              </Link>
              <Link
                to="/admin/reports"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex-shrink-0"
              >
                <span>Moderation Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Hostel Announcements Section */}
        {announcements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">Hostel Announcements</h2>
              </div>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/announcements"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}
            </div>
          </div>
        )}

        {/* Community Polls Section */}
        {polls.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">Community Polls</h2>
              </div>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/announcements"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {polls.map((p) => (
                <PollCard
                  key={p.id}
                  poll={p}
                  onPollUpdated={(updated) => {
                    setPolls((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Search & Discovery Card */}
        <GlassCard variant="default" glow={true} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-md">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Search Community Knowledge</h3>
              <p className="text-xs text-slate-400">
                Find past discussion messages, official notices, polls, and channels across the hostel.
              </p>
            </div>
          </div>
          <Link
            to="/search"
            className="btn-cinema-primary text-xs py-2.5 px-4 flex-shrink-0"
          >
            <span>Open Search Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </GlassCard>

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
            <Badge variant="indigo" size="sm">
              {accessibleRooms.length} Channels Authorized
            </Badge>
          </div>

          {/* Loading state */}
          {loadingRooms && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-900/50 border border-white/[0.06] animate-pulse" />
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
                const unreadCount =
                  roomUnreads[room._id] ?? roomUnreads[room.slug] ?? roomUnreads[room.name] ?? 0;

                return (
                  <GlassCard
                    key={room._id}
                    variant="interactive"
                    glow={true}
                    hoverLift={true}
                    onClick={() => navigate(`/community/${room.slug}`)}
                    className="group relative cursor-pointer p-5 sm:p-7 flex flex-col justify-between"
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
                            } p-[1px] flex items-center justify-center flex-shrink-0 shadow-md`}
                          >
                            <div className="w-full h-full bg-[#080d19] rounded-[11px] flex items-center justify-center">
                              {isGlobal ? (
                                <Globe className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                              ) : (
                                <GraduationCap className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {room.name}
                            </h3>
                            <Badge variant={isGlobal ? 'cyan' : 'indigo'} size="sm">
                              {isGlobal ? 'Everyone in Prof. S.N. Bose Boys Hostel' : `Private room for ${room.allowedYear} students`}
                            </Badge>
                          </div>
                        </div>

                        {unreadCount > 0 ? (
                          <Badge variant="rose" size="sm" dot={true}>
                            {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
                          </Badge>
                        ) : (
                          <Badge variant="emerald" size="sm" dot={true} className="hidden sm:inline-flex">
                            Live Chat
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed min-h-[44px]">
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
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* Academic Year Enforcement Informational Card */}
          <GlassCard variant="default" className="p-5 sm:p-6 space-y-3 text-xs text-slate-300">
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
          </GlassCard>

        </div>

      </main>

      {/* Identity Card Modal */}
      {identityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <GlassCard variant="elevated" glow={true} className="relative w-full max-w-md p-5 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto animate-modal-enter">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                  {getAvatarDisplay(user?.anonymousAvatar)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white truncate">My Community Identity</h3>
                  <p className="text-xs text-slate-400 truncate">Prof. S.N. Bose Boys Hostel</p>
                </div>
              </div>
              <button
                onClick={() => setIdentityModalOpen(false)}
                aria-label="Close modal"
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
                {getAvatarDisplay(user?.anonymousAvatar)}
              </div>
              <div className="space-y-1.5 min-w-0 px-2">
                <h4 className="text-xl font-bold text-white break-words" title={user?.anonymousName}>
                  {user?.anonymousName}
                </h4>
                <div className="pt-0.5">
                  <Badge variant="cyan" size="sm">
                    {user?.year} Resident
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-300 italic">
                "Your real name is not displayed to other students in any room or live chat."
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIdentityModalOpen(false)}
                className="btn-cinema-primary text-xs py-2 px-6"
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Authenticated Footer */}
      <footer className="border-t border-white/[0.06] bg-[#05080f] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Prof. S.N. Bose Boys Hostel Community • Live Platform Active</span>
          <span className="font-mono text-slate-400">Connected as {user?.anonymousName}</span>
        </div>
      </footer>

    </CinematicBackground>
  );
};

export default Dashboard;
