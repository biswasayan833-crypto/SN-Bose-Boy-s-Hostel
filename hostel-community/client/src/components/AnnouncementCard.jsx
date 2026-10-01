import React from 'react';
import {
  Pin,
  AlertTriangle,
  Bell,
  Info,
  Globe,
  GraduationCap,
  Shield,
  Clock,
  Trash2,
  Edit2,
} from 'lucide-react';

const priorityConfig = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    border: 'hover:border-rose-500/40',
    icon: AlertTriangle,
  },
  important: {
    label: 'Important',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    border: 'hover:border-amber-500/40',
    icon: Bell,
  },
  normal: {
    label: 'General Notice',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    border: 'hover:border-indigo-500/40',
    icon: Info,
  },
};

export const AnnouncementCard = ({
  announcement,
  isAdmin = false,
  onEdit = null,
  onDelete = null,
  onTogglePin = null,
}) => {
  if (!announcement) return null;

  const {
    id,
    title,
    content,
    priority = 'normal',
    isPinned = false,
    targetRoom,
    author = 'Hostel Administration',
    createdAt,
    expiresAt,
  } = announcement;

  const config = priorityConfig[priority] || priorityConfig.normal;
  const PriorityIcon = config.icon;

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`relative rounded-2xl bg-[#0b0f19]/90 border border-white/[0.08] ${config.border} p-5 sm:p-6 transition-all duration-300 shadow-md shadow-black/20 hover:shadow-xl hover:shadow-indigo-950/20 group flex flex-col justify-between`}
    >
      <div>
        {/* Top Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pinned Badge */}
            {isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-sm">
                <Pin className="w-3 h-3 text-violet-400 rotate-45" />
                Pinned
              </span>
            )}

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
            >
              <PriorityIcon className="w-3 h-3" />
              {config.label}
            </span>

            {/* Target Room Badge */}
            {targetRoom && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
                {targetRoom.type === 'global' ? (
                  <Globe className="w-3 h-3 text-cyan-400" />
                ) : (
                  <GraduationCap className="w-3 h-3 text-indigo-400" />
                )}
                {targetRoom.name}
              </span>
            )}
          </div>

          {/* Admin Management Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {onTogglePin && (
                <button
                  type="button"
                  onClick={() => onTogglePin(announcement)}
                  title={isPinned ? 'Unpin announcement' : 'Pin announcement'}
                  className={`p-1.5 rounded-lg border text-xs transition-colors ${
                    isPinned
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(announcement)}
                  title="Edit announcement"
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(announcement)}
                  title="Delete announcement"
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug group-hover:text-indigo-200 transition-colors">
          {title}
        </h3>

        {/* Content Body */}
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-4 font-normal">
          {content}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium text-slate-300">{author}</span>
        </div>

        <div className="flex items-center gap-3">
          {expiresAt && (
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3" />
              Expires {new Date(expiresAt).toLocaleDateString()}
            </span>
          )}
          <span>{formatRelativeTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;
