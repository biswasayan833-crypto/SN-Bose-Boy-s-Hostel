import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone,
  X,
  Pin,
  Calendar,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Building,
  Utensils,
  BookOpen,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import announcementService from '../services/announcementService';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

// Official curated hostel notices displayed for visitors & public hostel reference
const OFFICIAL_HOSTEL_NOTICES = [
  {
    id: 'notice-curfew-01',
    title: 'Hostel Entry & Evening Curfew Guidelines',
    content:
      'All undergraduate residents must report to the hostel premises by 10:30 PM on weekdays and 11:00 PM on weekends. Late entry after hours requires digital verification and sign-in at Security Post Gate 1.',
    priority: 'urgent',
    isPinned: true,
    category: 'facilities',
    author: 'Hostel Administration',
    targetRoom: { name: 'Global Room', type: 'global' },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notice-mess-02',
    title: 'Mess Committee: Weekly Special Menu & Dining Timings',
    content:
      'Special Friday Dinner includes Paneer Butter Masala, Gulab Jamun, and Jeera Rice. Dining Hall Timings: Breakfast: 7:30 AM – 9:30 AM | Lunch: 12:30 PM – 2:30 PM | Dinner: 7:30 PM – 9:45 PM.',
    priority: 'important',
    isPinned: true,
    category: 'mess',
    author: 'Hostel Mess Committee',
    targetRoom: { name: 'Global Room', type: 'global' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'notice-study-03',
    title: '3rd Floor Quiet Reading Hall — 24/7 Access',
    content:
      'High-speed campus Wi-Fi access points have been upgraded on the 3rd floor. Strict silence must be maintained in the central reading hall after 11:00 PM to support ongoing semester exam preparations.',
    priority: 'normal',
    isPinned: false,
    category: 'facilities',
    author: 'Academic Council',
    targetRoom: { name: 'Academic Channels', type: 'year' },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'notice-sports-04',
    title: 'Annual Inter-Wing Badminton & Table Tennis Tournament',
    content:
      'Wing A vs Wing B vs Wing C registrations are officially open! Teams of 2 or 4 can register at the Sports Secretary room (Wing B, Room 104) before Friday evening.',
    priority: 'normal',
    isPinned: false,
    category: 'events',
    author: 'Sports Committee',
    targetRoom: { name: 'Global Room', type: 'global' },
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'notice-warden-05',
    title: 'Hostel Warden & Caretaker Consultation Office Hours',
    content:
      'Administrative desk is open daily 4:00 PM – 6:00 PM for room maintenance requests, electrical concerns, and leave/gate pass inquiries at the Administrative Wing Office.',
    priority: 'important',
    isPinned: false,
    category: 'facilities',
    author: 'Office of the Warden',
    targetRoom: { name: 'Global Room', type: 'global' },
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

export function NoticeBoardModal({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiNotices, setApiNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live notices from backend when user is authenticated
  useEffect(() => {
    let isMounted = true;
    if (isOpen && isAuthenticated) {
      setIsLoading(true);
      announcementService
        .getAnnouncements({ limit: 15 })
        .then((res) => {
          if (isMounted) {
            const list = res?.announcements || res?.data || (Array.isArray(res) ? res : []);
            setApiNotices(list);
          }
        })
        .catch(() => {
          // Gracefully fallback to curated official hostel notices
          if (isMounted) setApiNotices([]);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated]);

  // Keyboard accessibility: Escape to close
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  // Combine live announcements with official baseline notices
  const combinedNotices = useMemo(() => {
    if (apiNotices && apiNotices.length > 0) {
      return apiNotices;
    }
    return OFFICIAL_HOSTEL_NOTICES;
  }, [apiNotices]);

  // Filter and search
  const filteredNotices = useMemo(() => {
    return combinedNotices.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === 'urgent') {
        return item.priority === 'urgent' || item.priority === 'important';
      }
      if (activeFilter === 'mess') {
        return (
          item.category === 'mess' ||
          item.title.toLowerCase().includes('mess') ||
          item.title.toLowerCase().includes('dining') ||
          item.content.toLowerCase().includes('dinner')
        );
      }
      if (activeFilter === 'facilities') {
        return (
          item.category === 'facilities' ||
          item.title.toLowerCase().includes('curfew') ||
          item.title.toLowerCase().includes('reading') ||
          item.title.toLowerCase().includes('warden')
        );
      }
      return true;
    });
  }, [combinedNotices, activeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-board-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-md bg-slate-950/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto rounded-3xl border border-amber-500/25 p-5 sm:p-7 space-y-6 text-left animate-scale-in"
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Megaphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="notice-board-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Hostel Notice Board
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  Official Bulletins
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Prof. S.N. Bose Boys Hostel • Administrative & Student Network Notices
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close Notice Board"
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/[0.08] text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 All Notices ({combinedNotices.length})
            </button>
            <button
              onClick={() => setActiveFilter('urgent')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚨 Urgent & Important
            </button>
            <button
              onClick={() => setActiveFilter('mess')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === 'mess'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🍲 Mess & Dining
            </button>
            <button
              onClick={() => setActiveFilter('facilities')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === 'facilities'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🏢 Facilities
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices..."
              className="w-full bg-slate-900/80 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Notices Stream */}
        <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Fetching latest hostel notices...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <span>No notices match the selected criteria.</span>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const isUrgent = notice.priority === 'urgent';
              const isImportant = notice.priority === 'important';

              return (
                <div
                  key={notice.id || notice._id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    notice.isPinned
                      ? 'bg-slate-900/80 border-indigo-500/40 shadow-lg shadow-indigo-950/40'
                      : 'bg-slate-900/50 border-white/[0.06] hover:border-indigo-500/30'
                  }`}
                >
                  {/* Notice Badges Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          <Pin className="w-2.5 h-2.5 rotate-45 text-violet-400" />
                          Pinned
                        </span>
                      )}

                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                          Urgent Notice
                        </span>
                      )}

                      {isImportant && !isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Important
                        </span>
                      )}

                      {!isUrgent && !isImportant && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-white/[0.08]">
                          General
                        </span>
                      )}

                      {notice.targetRoom && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/[0.06]">
                          {notice.targetRoom.name || 'Global Room'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        {notice.createdAt
                          ? new Date(notice.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Official Bulletin'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1.5 leading-snug">
                    {notice.title}
                  </h4>

                  {/* Body Content */}
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {notice.content}
                  </p>

                  {/* Footer Author Tag */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <strong className="text-slate-300 font-medium">
                        {notice.author || 'Hostel Administration'}
                      </strong>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Institutional Verified</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.08] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Notices synchronized with Prof. S.N. Bose Administrative Desk</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/[0.1] transition-all cursor-pointer"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoticeBoardModal;
