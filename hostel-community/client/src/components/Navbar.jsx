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
} from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';

import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

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
          ? 'bg-[#080b12]/85 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/20 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Hostel Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-[1px] shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${online ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${online ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                Prof. S.N. Bose
              </span>
              <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400">
                Boys Hostel Community
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#home"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Home
            </a>
            <a
              href="#community"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Community
            </a>
            <a
              href="#identity"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Identity
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              About
            </a>
          </nav>

          {/* Action CTAs & Status Pill */}
          <div className="hidden md:flex items-center gap-4">
            {/* Live Backend Connection Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
                online
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : loading
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
              title={online ? 'Backend API connected and operating' : 'Connecting to API'}
            >
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{online ? 'API Online' : loading ? 'Checking...' : 'Offline'}</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-md"
                >
                  <span className="text-base">{user?.anonymousAvatar}</span>
                  <span className="text-xs">{user?.anonymousName}</span>
                  <LayoutDashboard className="w-4 h-4 text-indigo-400 ml-1" />
                </Link>

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition-all shadow-sm"
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

              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold text-white rounded-xl group bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all active:scale-[0.98]"
                >
                  <span className="relative px-4 py-2 transition-all ease-in duration-150 bg-[#0c101d] rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-2">
                    <span>Join Community</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-3 md:hidden">
            {isAuthenticated && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-6 px-4 bg-[#0d1222] border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Home
            </a>
            <a
              href="#community"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Community
            </a>
            <a
              href="#identity"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Identity
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              About
            </a>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Backend Status:</span>
              <span className={`text-xs font-mono font-medium ${online ? 'text-emerald-400' : 'text-amber-400'}`}>
                {online ? '● Online' : '○ Standby'}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin/reports"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-amber-200 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Moderation Hub</span>
                      </Link>
                      <Link
                        to="/admin/announcements"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Megaphone className="w-4 h-4 text-indigo-400" />
                        <span>Announcements & Polls</span>
                      </Link>
                    </>
                  )}
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Dashboard ({user?.anonymousName})</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>My Profile & Settings</span>
                  </Link>

                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 transition-colors text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-indigo-600/30 text-center"
                  >
                    Join Community
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
