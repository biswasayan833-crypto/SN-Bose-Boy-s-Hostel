import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Globe,
  GraduationCap,
  Shield,
  AlertCircle,
  MessageSquare,
  Lock,
  Pin,
  ChevronDown,
  Paperclip,
  FileText,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getRoom,
  getMessages,
  markRoomAsRead,
  getPinnedMessages,
  pinMessage,
  unpinMessage,
} from '../services/roomService';
import socketService from '../services/socketService';
import messageService from '../services/messageService';
import MessageBubble from '../components/MessageBubble';
import { getAvatarDisplay } from '../components/AvatarPicker';
import NotificationDropdown from '../components/NotificationDropdown';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { CinematicBackground } from '../components/ui/CinematicBackground';

export const ChatPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch room details and initial message history
  useEffect(() => {
    let isMounted = true;

    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch room info (enforces backend year authorization)
        const roomRes = await getRoom(slug);
        const currentRoom = roomRes?.data?.room;

        if (!isMounted) return;
        setRoom(currentRoom);

        // Mark room as read upon opening
        markRoomAsRead(currentRoom._id).catch(() => {});
        socketService.markRoomRead(currentRoom._id);

        // Fetch initial messages and pinned messages for room
        const [msgRes, pinnedRes] = await Promise.all([
          getMessages(currentRoom._id, { page: 1, limit: 50 }),
          getPinnedMessages(currentRoom._id),
        ]);
        if (!isMounted) return;
        setMessages(msgRes?.data?.messages || []);
        setPinnedMessages(pinnedRes?.data?.pinnedMessages || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load community room.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRoomData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Clean up object URL on change or unmount
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // 2. Setup Socket.IO connection and room listeners
  useEffect(() => {
    if (!room) return;

    socketService.connect();
    socketService.joinRoom(room._id);

    const unsubscribeStatus = socketService.onStatusChange((status) => {
      setSocketStatus(status);
    });

    const unsubscribeNewMessage = socketService.onNewMessage((newMsg) => {
      if (newMsg.room === room._id || newMsg.room?._id === room._id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id || m._id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        markRoomAsRead(room._id).catch(() => {});
        socketService.markRoomRead(room._id);
      }
    });

    const unsubscribeReactionUpdated = socketService.onReactionUpdated((payload) => {
      const { messageId, reactions } = payload;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId || m._id === messageId) {
            return { ...m, reactions };
          }
          return m;
        })
      );
    });

    const unsubscribeMessageDeleted = socketService.onMessageDeleted((payload) => {
      const { messageId } = payload;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId || m._id === messageId) {
            return {
              ...m,
              isDeleted: true,
              content: 'This message was deleted by its author.',
              attachment: null,
              reactions: [],
            };
          }
          return m;
        })
      );
      setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));
    });

    const unsubscribeMessagePinned = socketService.onMessagePinned((payload) => {
      const { messageId, isPinned, message: pinnedObj } = payload;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId || m._id === messageId) {
            return { ...m, isPinned };
          }
          return m;
        })
      );
      if (isPinned && pinnedObj) {
        setPinnedMessages((prev) => [pinnedObj, ...prev.filter((p) => p.id !== messageId)]);
      }
    });

    const unsubscribeMessageUnpinned = socketService.onMessageUnpinned((payload) => {
      const { messageId } = payload;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId || m._id === messageId) {
            return { ...m, isPinned: false };
          }
          return m;
        })
      );
      setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));
    });

    const unsubscribeRoomError = socketService.onRoomError((errPayload) => {
      setError(errPayload?.message || 'A real-time room error occurred.');
    });

    return () => {
      socketService.leaveRoom(room._id);
      unsubscribeStatus();
      unsubscribeNewMessage();
      unsubscribeReactionUpdated();
      unsubscribeMessageDeleted();
      unsubscribeMessagePinned();
      unsubscribeMessageUnpinned();
      unsubscribeRoomError();
    };
  }, [room]);

  // 3. Scroll to targeted message or bottom when messages update
  const targetMessageId = searchParams.get('messageId');

  useEffect(() => {
    if (targetMessageId && messages.length > 0) {
      const el = document.getElementById(`msg-${targetMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(targetMessageId);
        const timer = setTimeout(() => setHighlightedMessageId(null), 3500);
        return () => clearTimeout(timer);
      }
    } else if (!targetMessageId && messages.length > 0) {
      scrollToBottom(messages.length <= 10 ? 'auto' : 'smooth');
    }
  }, [messages.length, targetMessageId]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Check size limit: 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check extension
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Please select a JPG, JPEG, PNG, WEBP, or PDF file.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl('');
    }
  };

  // Remove selected file before sending
  const handleRemoveFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to format file size in UI
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Handle message submission (supports both text and attachments)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const trimmed = inputContent.trim();
    if ((!trimmed && !selectedFile) || sending || !room) return;

    try {
      setSending(true);
      setError('');

      if (selectedFile) {
        // Upload attachment via multipart/form-data REST endpoint
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (trimmed) {
          formData.append('content', trimmed);
        }

        await messageService.uploadAttachment(room._id, formData, (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        });

        // Clear input and attachments on success
        handleRemoveFile();
        setInputContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        setUploadProgress(0);
        setSending(false);
      } else {
        // Send regular text message via Socket.IO
        socketService.sendMessage(room._id, trimmed, (ack) => {
          setSending(false);
          if (ack && ack.success) {
            setInputContent('');
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
          } else if (ack && !ack.success) {
            setError(ack.message || 'Failed to send message.');
          }
        });
      }
    } catch (err) {
      setSending(false);
      setUploadProgress(0);
      setError(err.message || 'Message dispatch failed.');
    }
  };

  // Handle reaction toggle (Socket with REST fallback)
  const handleReactionToggle = async (messageId, type, currentlyReacted) => {
    const currentUserId = user?.id || user?._id;
    try {
      if (currentlyReacted) {
        // Optimistic UI update
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const newReactions = (m.reactions || []).filter(
              (r) => !(r.user === currentUserId && r.type === type)
            );
            return { ...m, reactions: newReactions };
          })
        );
        socketService.removeReaction(messageId, type, (ack) => {
          if (!ack || !ack.success) {
            messageService.removeReaction(messageId, type).catch(() => {});
          }
        });
      } else {
        // Optimistic UI update
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const existing = (m.reactions || []).filter(
              (r) => !(r.user === currentUserId && r.type === type)
            );
            return {
              ...m,
              reactions: [...existing, { user: currentUserId, type }],
            };
          })
        );
        socketService.addReaction(messageId, type, (ack) => {
          if (!ack || !ack.success) {
            messageService.addReaction(messageId, type).catch(() => {});
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update reaction.');
    }
  };

  // Handle soft deletion (Socket with REST fallback)
  const handleDeleteMessage = async (messageId) => {
    try {
      // Optimistic UI update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              isDeleted: true,
              content: 'This message was deleted by its author.',
              attachment: null,
              reactions: [],
            };
          }
          return m;
        })
      );
      setPinnedMessages((prev) => prev.filter((p) => p.id !== messageId));

      socketService.deleteMessage(messageId, (ack) => {
        if (!ack || !ack.success) {
          messageService.deleteMessage(messageId).catch(() => {});
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to delete message.');
    }
  };

  // Handle report submission
  const handleReportMessage = async ({ messageId, reason, notes }) => {
    try {
      await messageService.reportMessage(messageId, { reason, notes });
    } catch (err) {
      throw new Error(err.message || 'Failed to submit message report.');
    }
  };

  // Handle pin / unpin message (Admin only)
  const handleTogglePin = async (messageId, pinStatus) => {
    try {
      if (pinStatus) {
        await pinMessage(room._id, messageId);
      } else {
        await unpinMessage(room._id, messageId);
      }
    } catch (err) {
      setError(err.message || 'Failed to update pinned state.');
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInputContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Send on Enter (without Shift)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isGlobal = room?.type === 'global';

  return (
    <CinematicBackground className="selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Channel Header Bar */}
      <header className="sticky top-0 z-40 glass-panel-deep border-b border-white/[0.08] shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
          
          {/* Left: Back button & Room Details */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl bg-slate-900/90 border border-white/[0.08] text-slate-400 hover:text-white hover:border-indigo-500/50 transition-colors flex-shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                  isGlobal ? 'from-blue-600 to-cyan-600' : 'from-violet-600 to-indigo-600'
                } p-[1px] flex items-center justify-center flex-shrink-0 shadow-md`}
              >
                <div className="w-full h-full bg-[#080d19] rounded-[11px] flex items-center justify-center">
                  {isGlobal ? (
                    <Globe className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white truncate">
                    {room?.name || 'Loading Channel...'}
                  </h1>
                  <Badge variant={isGlobal ? 'cyan' : 'indigo'} size="sm" className="hidden sm:inline-flex">
                    {isGlobal ? 'Global' : room?.allowedYear}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  {room?.description || 'Prof. S.N. Bose Boys Hostel Community'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Socket Connection Pill & Notifications & User Persona */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* Room Search Link */}
            {room && (
              <Link
                to={`/search?roomId=${room._id}`}
                className="p-2 rounded-xl bg-slate-900/90 border border-white/[0.08] text-slate-400 hover:text-white hover:border-indigo-500/40 transition-colors"
                title={`Search messages in ${room.name}`}
              >
                <Search className="w-4 h-4" />
              </Link>
            )}

            {/* Socket Status Pill */}
            <Badge
              variant={
                socketStatus === 'connected'
                  ? 'emerald'
                  : socketStatus === 'connecting'
                  ? 'amber'
                  : 'rose'
              }
              size="sm"
              dot={true}
            >
              <span className="capitalize">{socketStatus}</span>
            </Badge>

            {/* User Anonymous Pill */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-white/[0.08] px-3 py-1 rounded-xl text-xs font-semibold max-w-[240px]">
              <span className="text-sm flex-shrink-0">{getAvatarDisplay(user?.anonymousAvatar)}</span>
              <span className="text-slate-200 truncate">{user?.anonymousName}</span>
              <span className="text-[10px] font-mono text-cyan-300 flex-shrink-0">({user?.year})</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Chat Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 flex flex-col py-4 min-h-0">
        
        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-semibold text-[11px] transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Messages Stream Card */}
        <GlassCard variant="elevated" glow={true} className="flex-1 p-3.5 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl relative min-h-[420px]">
          
          {/* Pinned Messages Tray */}
          {pinnedMessages.length > 0 && (
            <div className="mb-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 p-3 sm:p-4 shadow-md flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Pin className="w-3.5 h-3.5 rotate-45 text-indigo-400" />
                  <span>Pinned Messages ({pinnedMessages.length})</span>
                </div>
                {pinnedMessages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPinnedExpanded(!pinnedExpanded)}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    <span>{pinnedExpanded ? 'Collapse' : 'Show all'}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        pinnedExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Pinned item(s) */}
              <div className="mt-2.5 space-y-2">
                {(pinnedExpanded ? pinnedMessages : [pinnedMessages[0]]).map((pMsg) => (
                  <div
                    key={pMsg.id}
                    className="flex items-center justify-between gap-3 text-xs bg-slate-900/80 border border-white/[0.06] rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <span className="text-sm flex-shrink-0">
                        {getAvatarDisplay(pMsg.sender?.anonymousAvatar)}
                      </span>
                      <span className="font-semibold text-indigo-300 flex-shrink-0">
                        {pMsg.sender?.anonymousName}:
                      </span>
                      <span className="text-slate-200 truncate">
                        "{pMsg.content}"
                      </span>
                    </div>

                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(pMsg.id, false)}
                        title="Unpin message"
                        className="text-[10px] text-slate-400 hover:text-rose-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-white/[0.06] hover:bg-slate-700 transition-colors flex-shrink-0"
                      >
                        Unpin
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable Message Feed Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
            
            {/* Loading State */}
            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
                <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-xs font-mono text-slate-400">Loading channel messages...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20 px-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No conversations yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Be the first one to start the conversation in {room?.name}.
                  </p>
                </div>
                <Badge variant="cyan" size="sm">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Your real name is not displayed to other students</span>
                </Badge>
              </div>
            )}

            {/* Messages List Rendered via MessageBubble */}
            {!loading &&
              messages.map((msg) => (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`transition-all duration-700 rounded-3xl ${
                    highlightedMessageId === msg.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-500/10 p-1 shadow-lg shadow-indigo-500/30 animate-highlight-flash'
                      : ''
                  }`}
                >
                  <MessageBubble
                    message={msg}
                    currentUser={user}
                    onReactionToggle={handleReactionToggle}
                    onDeleteMessage={handleDeleteMessage}
                    onReportMessage={handleReportMessage}
                    onTogglePin={handleTogglePin}
                  />
                </div>
              ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Box */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
            
            {/* Selected File Preview Banner (if file selected) */}
            {selectedFile && (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/40 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {filePreviewUrl ? (
                    <img
                      src={filePreviewUrl}
                      alt="Upload preview"
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-rose-400" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                      {selectedFile.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatFileSize(selectedFile.size)}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <span className="text-indigo-400 ml-2">Uploading {uploadProgress}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={sending}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
              {/* Attachment Picker Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || sending || !room}
                className="h-[44px] w-[44px] sm:h-[46px] sm:w-[46px] rounded-2xl bg-slate-900/90 border border-white/[0.1] hover:border-indigo-500/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95 cursor-pointer"
                title="Attach image or PDF (Max 5 MB)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <div className="relative flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputContent}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedFile
                      ? `Add an optional caption for ${selectedFile.name}...`
                      : `Type an anonymous message in ${room?.name || 'this room'}... (Enter to send)`
                  }
                  maxLength={1000}
                  disabled={loading || !room || sending}
                  className="input-cinema resize-none py-2.5 sm:py-3 pl-3.5 sm:pl-4 pr-11 sm:pr-12 text-xs sm:text-sm max-h-32 disabled:opacity-50"
                />

                <span className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-3 text-[9px] sm:text-[10px] text-slate-500 font-mono">
                  {inputContent.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={(!inputContent.trim() && !selectedFile) || sending || loading || !room}
                className="btn-cinema-primary h-[44px] w-[44px] sm:h-[46px] sm:w-[46px] p-0 flex-shrink-0 cursor-pointer"
                title="Send Message"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Privacy Reassurance Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Your real name is not displayed to other students.</span>
              </div>
              <span className="hidden sm:inline text-slate-500 font-mono">Shift + Enter for new line</span>
            </div>

          </div>

        </GlassCard>

      </div>

    </CinematicBackground>
  );
};

export default ChatPage;
