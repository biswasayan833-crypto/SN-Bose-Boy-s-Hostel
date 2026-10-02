import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Trash2,
  Flag,
  ShieldAlert,
  X,
  AlertCircle,
  CheckCircle2,
  Pin,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { getAvatarDisplay } from './AvatarPicker';

export const REACTION_CONFIG = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
];

export const MessageBubble = ({
  message,
  currentUser,
  onReactionToggle,
  onDeleteMessage,
  onReportMessage,
  onTogglePin,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('spam');
  const [reportNotes, setReportNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [actionError, setActionError] = useState('');

  const menuRef = useRef(null);

  // Close 3-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const currentUserId = currentUser?.id || currentUser?._id;
  const isCurrentUser =
    Boolean(currentUserId) &&
    (message.sender?.id === currentUserId ||
      message.sender?.id === String(currentUserId) ||
      message.sender?._id === currentUserId);

  const isDeleted = Boolean(message.isDeleted);

  // Format timestamp helper
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Helper to build authenticated URL for image/file preview
  const getAuthAttachmentUrl = (rawUrl) => {
    if (!rawUrl) return '';
    const token = localStorage.getItem('snbose_auth_token');
    if (!token) return rawUrl;
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}token=${encodeURIComponent(token)}`;
  };

  // Check if current user has reacted with a given type
  const hasUserReacted = (type) => {
    if (!currentUserId || !Array.isArray(message.reactions)) return false;
    return message.reactions.some(
      (r) => (r.user === currentUserId || r.user === String(currentUserId)) && r.type === type
    );
  };

  // Get reaction count for a type
  const getReactionCount = (type) => {
    if (message.reactionCounts && typeof message.reactionCounts[type] === 'number') {
      return message.reactionCounts[type];
    }
    if (Array.isArray(message.reactions)) {
      return message.reactions.filter((r) => r.type === type).length;
    }
    return 0;
  };

  // Handle reaction click
  const handleReactionClick = (type) => {
    if (isDeleted) return;
    const isReacted = hasUserReacted(type);
    if (onReactionToggle) {
      onReactionToggle(message.id, type, isReacted);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    try {
      setSubmittingAction(true);
      setActionError('');
      if (onDeleteMessage) {
        await onDeleteMessage(message.id);
      }
      setDeleteModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to delete message.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle submit report
  const handleConfirmReport = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmittingAction(true);
      setActionError('');
      if (onReportMessage) {
        await onReportMessage(message.id, {
          reason: selectedReason,
          notes: reportNotes,
        });
      }
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModalOpen(false);
        setReportNotes('');
        setSelectedReason('spam');
      }, 1400);
    } catch (err) {
      setActionError(err.message || 'Failed to report message.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Active reactions with count > 0
  const activeReactions = REACTION_CONFIG.filter((cfg) => getReactionCount(cfg.type) > 0);

  return (
    <div
      className={`flex flex-col ${
        isCurrentUser ? 'items-end' : 'items-start'
      } space-y-1 group relative`}
    >
      {/* Sender Persona Metadata */}
      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
        <span className="text-sm">{getAvatarDisplay(message.sender?.anonymousAvatar)}</span>
        <span
          className={`font-semibold ${
            isCurrentUser ? 'text-indigo-300' : 'text-slate-200'
          }`}
        >
          {message.sender?.anonymousName}
        </span>
        <span className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700/60 font-mono">
          {message.sender?.year}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {formatTime(message.createdAt)}
        </span>
        {message.isPinned && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded border border-violet-500/30">
            <Pin className="w-2.5 h-2.5 rotate-45 text-violet-400" />
            Pinned
          </span>
        )}
      </div>

      {/* Bubble Row with Hover Quick-Actions */}
      <div
        className={`relative flex items-center gap-1.5 max-w-[88%] sm:max-w-[75%] ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Message Bubble Body */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-md transition-all ${
            isDeleted
              ? 'bg-slate-900/60 border border-slate-800/80 text-slate-400 italic rounded-tl-none sm:min-w-[160px]'
              : isCurrentUser
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
              : 'bg-slate-900/90 border border-white/[0.08] text-slate-100 rounded-tl-none'
          }`}
        >
          {isDeleted ? (
            <div className="flex items-center gap-2 py-0.5 text-slate-400 text-xs select-none">
              <Trash2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Message deleted</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Media Attachment Display */}
              {message.attachment && (
                <div className="rounded-xl overflow-hidden pt-0.5">
                  {message.attachment.mimeType?.startsWith('image/') ? (
                    /* Image Thumbnail Preview */
                    <div className="space-y-1.5">
                      <div
                        onClick={() => setImagePreviewOpen(true)}
                        className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10 group/img cursor-pointer max-h-72 flex items-center justify-center hover:border-indigo-400/50 transition-colors"
                        title="Click to view image"
                      >
                        <img
                          src={getAuthAttachmentUrl(message.attachment.url)}
                          alt={message.attachment.originalName}
                          className="w-full h-auto max-h-72 object-contain rounded-xl hover:scale-[1.01] transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="p-2 rounded-xl bg-black/70 text-white backdrop-blur-md">
                            <ExternalLink className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-300 font-mono px-0.5">
                        <span className="truncate max-w-[180px] sm:max-w-xs">{message.attachment.originalName}</span>
                        <span className="flex-shrink-0 text-slate-400">({formatFileSize(message.attachment.size)})</span>
                      </div>
                    </div>
                  ) : (
                    /* PDF Document Card */
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-indigo-500/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-rose-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-xs" title={message.attachment.originalName}>
                            {message.attachment.originalName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            PDF • {formatFileSize(message.attachment.size)}
                          </div>
                        </div>
                      </div>

                      <a
                        href={getAuthAttachmentUrl(message.attachment.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-medium flex-shrink-0"
                        title="Open PDF"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Message text content */}
              {message.content && (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          )}
        </div>

        {/* Hover Quick Actions Bar (hidden when message is deleted) */}
        {!isDeleted && (
          <div
            className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-[#0b0f19]/95 border border-white/[0.1] rounded-full px-2 py-1 shadow-lg backdrop-blur-md z-10 ${
              isCurrentUser ? 'mr-1' : 'ml-1'
            }`}
          >
            {/* Quick emoji buttons */}
            <div className="flex items-center gap-0.5">
              {REACTION_CONFIG.map((cfg) => {
                const reacted = hasUserReacted(cfg.type);
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => handleReactionClick(cfg.type)}
                    title={cfg.label}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs hover:scale-125 transition-transform ${
                      reacted
                        ? 'bg-indigo-500/30 scale-110 shadow-inner'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <span className="w-[1px] h-3 bg-white/20 mx-0.5" />

            {/* 3-Dot Context Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="More message options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* 3-Dot Dropdown Options */}
              {menuOpen && (
                <div
                  className={`absolute bottom-full mb-2 ${
                    isCurrentUser ? 'right-0' : 'left-0'
                  } w-36 bg-[#0d1222] border border-white/[0.12] rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100`}
                >
                  {currentUser?.role === 'admin' && onTogglePin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onTogglePin(message.id, !message.isPinned);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-violet-300 hover:text-violet-200 hover:bg-violet-500/10 flex items-center gap-2 transition-colors text-left"
                    >
                      <Pin className="w-3.5 h-3.5 text-violet-400" />
                      <span>{message.isPinned ? 'Unpin' : 'Pin Message'}</span>
                    </button>
                  )}

                  {isCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteModalOpen(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 flex items-center gap-2 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setReportModalOpen(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 flex items-center gap-2 transition-colors text-left"
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reaction Counts Bar (visible if message is NOT deleted and has reactions) */}
      {!isDeleted && activeReactions.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-1.5 pt-0.5 px-1 ${
            isCurrentUser ? 'justify-end' : 'justify-start'
          }`}
        >
          {activeReactions.map((cfg) => {
            const count = getReactionCount(cfg.type);
            const reacted = hasUserReacted(cfg.type);

            return (
              <button
                key={cfg.type}
                type="button"
                onClick={() => handleReactionClick(cfg.type)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-all active:scale-95 border ${
                  reacted
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-900/80 border-white/[0.08] text-slate-300 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
                title={`${cfg.label}: ${count} ${reacted ? '(You reacted)' : ''}`}
              >
                <span className="text-xs">{cfg.emoji}</span>
                <span className="text-[11px] font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c101d] border border-white/[0.12] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete this message?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This message will be replaced with{' '}
                <span className="text-slate-200 italic font-semibold">"Message deleted."</span>
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                {submittingAction ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0c101d] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Report Message</h3>
                  <p className="text-[11px] text-slate-400">
                    Help keep Prof. S.N. Bose Hostel safe and respectful
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center animate-in fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                <h4 className="text-sm font-bold text-white">Report Submitted</h4>
                <p className="text-xs text-slate-400">
                  Thank you. Our moderation team will review this message.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmReport} className="space-y-4">
                {actionError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    Why are you reporting this message?
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'spam', label: 'Spam' },
                      { id: 'harassment', label: 'Harassment' },
                      { id: 'hate', label: 'Hate' },
                      { id: 'inappropriate', label: 'Inappropriate' },
                      { id: 'threat', label: 'Threat' },
                      { id: 'other', label: 'Other' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedReason === opt.id
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-white font-medium'
                            : 'bg-slate-900/60 border-white/[0.05] text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={opt.id}
                          checked={selectedReason === opt.id}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="accent-indigo-500 w-3.5 h-3.5"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400 block">
                    Additional context (optional):
                  </label>
                  <textarea
                    rows={2}
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Provide brief details to help moderators..."
                    maxLength={300}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                  >
                    {submittingAction ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Submit Report</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Full Image Preview Lightbox Modal */}
      {imagePreviewOpen && message.attachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setImagePreviewOpen(false)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Close image"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={getAuthAttachmentUrl(message.attachment.url)}
              alt={message.attachment.originalName}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="mt-3 flex items-center justify-between w-full text-xs text-slate-300 px-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-semibold truncate max-w-md">{message.attachment.originalName}</span>
              <a
                href={`${getAuthAttachmentUrl(message.attachment.url)}&download=true`}
                download={message.attachment.originalName}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
