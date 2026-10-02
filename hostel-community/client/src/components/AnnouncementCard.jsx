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
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';

const priorityConfig = {
  urgent: {
    label: 'Urgent',
    variant: 'rose',
    icon: AlertTriangle,
  },
  important: {
    label: 'Important',
    variant: 'amber',
    icon: Bell,
  },
  normal: {
    label: 'General Notice',
    variant: 'indigo',
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
    <GlassCard
      variant="default"
      glow={isPinned}
      hoverLift={true}
      className={`p-5 sm:p-6 transition-all duration-300 hover:border-indigo-500/40 flex flex-col justify-between group`}
    >
      <div>
        {/* Top Badges Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pinned Badge */}
            {isPinned && (
              <Badge variant="violet" size="sm">
                <Pin className="w-3 h-3 text-violet-400 rotate-45" />
                <span>Pinned</span>
              </Badge>
            )}

            {/* Priority Badge */}
            <Badge variant={config.variant} size="sm">
              <PriorityIcon className="w-3 h-3" />
              <span>{config.label}</span>
            </Badge>

            {/* Target Room Badge */}
            {targetRoom && (
              <Badge variant="neutral" size="sm">
                {targetRoom.type === 'global' ? (
                  <Globe className="w-3 h-3 text-cyan-400" />
                ) : (
                  <GraduationCap className="w-3 h-3 text-indigo-400" />
                )}
                <span>{targetRoom.name}</span>
              </Badge>
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
                      : 'bg-slate-800/60 border-white/[0.08] text-slate-400 hover:text-white hover:bg-slate-700'
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
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-400 hover:text-indigo-300 hover:bg-slate-700 transition-colors text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(announcement)}
                  title="Delete announcement"
                  className="p-1.5 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors text-xs"
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
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line mb-4 font-normal">
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
    </GlassCard>
  );
};

export default AnnouncementCard;
