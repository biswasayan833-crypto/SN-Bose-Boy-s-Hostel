import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  Menu,
  X,
  ArrowRight,
  Lock,
  LogOut,
  LayoutDashboard,
  User,
  Megaphone,
  Search,
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { getAvatarDisplay } from './AvatarPicker';
import { Badge } from './ui/Badge';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { online, loading } = useHealthCheck();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-panel-deep border-b border-white/[0.08] shadow-2xl shadow-black/50 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Hostel Name */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group focus-ring rounded-xl min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/50 transition-all duration-300 flex-shrink-0">
              <div className="w-full h-full bg-[#070a12] rounded-[11px] flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    online ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    online ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors truncate">
                Prof. S.N. Bose
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium tracking-wider uppercase text-slate-400 truncate">
                Boys Hostel Community
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <a
              href="#home"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Home
            </a>
            <a
              href="#community"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Community
            </a>
            <a
              href="#identity"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Identity
            </a>
            <a
              href="#features"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              About
            </a>
          </nav>

          {/* Action CTAs & Status Pill */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Backend Connection Indicator */}
            <Badge
              variant={online ? 'emerald' : loading ? 'amber' : 'rose'}
              size="sm"
              dot={true}
              title={online ? 'Backend API connected and operating' : 'Connecting to API'}
            >
              {online ? 'API Online' : loading ? 'Checking...' : 'Offline'}
            </Badge>

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/search"
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-sm"
                  title="Search & Discovery"
                >
                  <Search className="w-4 h-4 text-indigo-400" />
                </Link>

                <NotificationDropdown />

                {user?.role === 'admin' && (
                  <>
                    <Link
                      to="/admin/reports"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-sm"
                      title="Moderation Hub"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Moderation</span>
                    </Link>
                    <Link
                      to="/admin/announcements"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all shadow-sm"
                      title="Announcements & Polls"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Notices</span>
                    </Link>
                  </>
                )}

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-900/90 border border-white/[0.1] hover:border-indigo-500/60 hover:bg-slate-800/90 transition-all shadow-md max-w-[200px]"
                >
                  <span className="text-sm flex-shrink-0">{getAvatarDisplay(user?.anonymousAvatar)}</span>
                  <span className="truncate">{user?.anonymousName}</span>
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400 ml-0.5 flex-shrink-0" />
                </Link>

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-sm"
                  title="Profile & Identity Management"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Profile</span>
                </Link>

                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 transition-colors flex items-center gap-1.5 rounded-xl hover:bg-white/[0.05]"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Login</span>
                </Link>

                <Link
                  to="/register"
                  className="btn-cinema-primary text-xs py-2 px-4 shadow-lg shadow-indigo-600/25"
                >
                  <span>Join Community</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-900/90 border border-white/[0.08] text-slate-300 hover:text-white focus-ring active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu with Smooth Animation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 glass-panel-elevated rounded-2xl shadow-2xl flex flex-col gap-3 animate-slide-down">
            <nav className="flex flex-col gap-1 pb-2 border-b border-white/[0.08]">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-white/[0.04] flex items-center"
              >
                Home
              </a>
              <a
                href="#community"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-white/[0.04] flex items-center"
              >
                Community
              </a>
              <a
                href="#identity"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-white/[0.04] flex items-center"
              >
                Identity
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-white/[0.04] flex items-center"
              >
                Features
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] px-3 rounded-xl hover:bg-white/[0.04] flex items-center"
              >
                About
              </a>
            </nav>

            <div className="flex items-center justify-between py-1 px-1">
              <span className="text-[11px] text-slate-400">Backend Status</span>
              <Badge variant={online ? 'emerald' : 'amber'} size="sm" dot={true}>
                {online ? 'Online' : 'Standby'}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/admin/reports"
                        onClick={() => setMobileMenuOpen(false)}
                        className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 text-center flex items-center justify-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Moderation</span>
                      </Link>
                      <Link
                        to="/admin/announcements"
                        onClick={() => setMobileMenuOpen(false)}
                        className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 text-center flex items-center justify-center gap-1.5"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Notices</span>
                      </Link>
                    </div>
                  )}

                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-cinema-primary text-xs min-h-[44px] py-2.5 w-full justify-center"
                  >
                    <span>Dashboard ({user?.anonymousName})</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 border border-white/[0.08] flex items-center justify-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Search</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 border border-white/[0.08] flex items-center justify-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Profile</span>
                    </Link>
                  </div>

                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full min-h-[44px] py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full min-h-[44px] py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 border border-white/[0.08] flex items-center justify-center text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-cinema-primary text-xs min-h-[44px] py-2.5 w-full justify-center"
                  >
                    <span>Join Community</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
