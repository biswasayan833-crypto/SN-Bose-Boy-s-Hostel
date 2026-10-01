import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Heart,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import socketService from '../services/socketService';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Helper for human-readable relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffSeconds = Math.max(0, Math.floor((now - date) / 1000));

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch unread count on mount
  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadNotificationCount();
      if (res?.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      // Ignore initial fetch errors
    }
  };

  // Fetch full notifications list
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 25 });
      if (res?.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Listen for real-time notifications via Socket.IO
    socketService.connect();
    const unsubscribe = socketService.onNotificationNew((newNotif) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => {
        // Prevent duplicate IDs
        if (prev.some((n) => n.id === newNotif.id)) {
          return prev.map((n) => (n.id === newNotif.id ? newNotif : n));
        }
        return [newNotif, ...prev];
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Handle error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      // Handle error
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    if (notif.room?.slug) {
      setIsOpen(false);
      navigate(`/community/${notif.room.slug}`);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reaction':
        return (
          <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 flex-shrink-0">
            <Heart className="w-4 h-4 fill-pink-400" />
          </div>
        );
      case 'moderation':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        aria-label="Notifications"
        className={`relative p-2 rounded-xl transition-all duration-200 border ${
          isOpen
            ? 'bg-slate-800 text-white border-indigo-500/50 shadow-md shadow-indigo-500/10'
            : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <Bell className="w-4 h-4 transition-transform active:scale-95" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-rose-500/30 animate-pulse border border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[#090d16]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[520px] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-slate-500">
                  You will be notified when hostel residents react to your messages or send updates.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notif.isRead
                      ? 'bg-transparent hover:bg-white/[0.02]'
                      : 'bg-indigo-500/[0.06] hover:bg-indigo-500/[0.1] border-l-2 border-indigo-500'
                  }`}
                >
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-snug break-words">
                      {notif.content}
                    </p>

                    {/* Anonymous Actor / Channel Meta */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      {notif.actor && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <span>{notif.actor.anonymousAvatar || '🎭'}</span>
                          <span className="font-medium text-slate-200">
                            {notif.actor.anonymousName}
                          </span>
                          <span className="text-[10px] text-indigo-300 font-mono">
                            ({notif.actor.year})
                          </span>
                        </span>
                      )}

                      {notif.room?.name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300 font-mono">
                          #{notif.room.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator bullet */}
                  {!notif.isRead && (
                    <span
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Click to mark as read"
                      className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5 group-hover:scale-125 transition-transform"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.08] bg-white/[0.01] text-center">
            <span className="text-[11px] text-slate-400 font-mono">
              Prof. S.N. Bose Boys Hostel Community
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
