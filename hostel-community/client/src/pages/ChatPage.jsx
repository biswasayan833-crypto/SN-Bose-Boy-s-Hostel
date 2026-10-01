import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import NotificationDropdown from '../components/NotificationDropdown';

export const ChatPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  // 2. Connect Socket.IO and subscribe to room events
  useEffect(() => {
    if (!room) return;

    // Connect socket
    socketService.connect();

    // Track connection state
    const unsubscribeStatus = socketService.onStatusChange((status) => {
      setSocketStatus(status);
    });

    // Join room
    socketService.joinRoom(room._id, (response) => {
      if (response && !response.success) {
        setError(response.message || 'Could not join room channel.');
      }
    });

    // Listen for incoming messages
    const unsubscribeNewMessage = socketService.onNewMessage((newMsg) => {
      if (newMsg && newMsg.room === room._id) {
        // Suppress unread badge for actively viewed room
        socketService.markRoomRead(room._id);

        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    // Listen for real-time reaction updates
    const unsubscribeReactionUpdated = socketService.onReactionUpdated((payload) => {
      if (payload && payload.roomId === room._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  reactions: payload.reactions || [],
                  reactionCounts: payload.reactionCounts || m.reactionCounts,
                }
              : m
          )
        );
      }
    });

    // Listen for real-time message deletion updates
    const unsubscribeMessageDeleted = socketService.onMessageDeleted((payload) => {
      if (payload && payload.roomId === room._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? {
                  ...m,
                  isDeleted: true,
                  content: 'Message deleted',
                  deletedAt: payload.deletedAt,
                  reactions: [],
                  reactionCounts: { like: 0, love: 0, laugh: 0, fire: 0, clap: 0 },
                }
              : m
          )
        );
      }
    });

    // Listen for real-time pinned message updates
    const unsubscribeMessagePinned = socketService.onMessagePinned((pinnedMsg) => {
      if (pinnedMsg && pinnedMsg.room === room._id) {
        setPinnedMessages((prev) => {
          const exists = prev.some((m) => m.id === pinnedMsg.id);
          if (exists) return prev.map((m) => (m.id === pinnedMsg.id ? pinnedMsg : m));
          return [pinnedMsg, ...prev];
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === pinnedMsg.id ? { ...m, isPinned: true } : m))
        );
      }
    });

    const unsubscribeMessageUnpinned = socketService.onMessageUnpinned(({ messageId, roomId }) => {
      if (roomId === room._id) {
        setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned: false } : m))
        );
      }
    });

    // Listen for room errors
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

  // 3. Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom(messages.length <= 10 ? 'auto' : 'smooth');
  }, [messages.length]);

  // Handle message submission
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const trimmed = inputContent.trim();
    if (!trimmed || sending || !room) return;

    try {
      setSending(true);

      // Send via Socket.IO
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
    } catch (err) {
      setSending(false);
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
            const newCounts = { ...m.reactionCounts };
            if (newCounts[type] && newCounts[type] > 0) newCounts[type] -= 1;
            return { ...m, reactions: newReactions, reactionCounts: newCounts };
          })
        );

        socketService.removeReaction(messageId, type, (ack) => {
          if (ack && !ack.success) {
            messageService.removeReaction(messageId, type).catch(console.error);
          }
        });
      } else {
        // Optimistic UI update
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const newReactions = [...(m.reactions || []), { user: currentUserId, type }];
            const newCounts = {
              ...m.reactionCounts,
              [type]: (m.reactionCounts?.[type] || 0) + 1,
            };
            return { ...m, reactions: newReactions, reactionCounts: newCounts };
          })
        );

        socketService.addReaction(messageId, type, (ack) => {
          if (ack && !ack.success) {
            messageService.addReaction(messageId, type).catch(console.error);
          }
        });
      }
    } catch (err) {
      console.error('[Reactions] Toggle error:', err);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    return new Promise((resolve, reject) => {
      socketService.deleteMessage(messageId, async (ack) => {
        if (ack && ack.success) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    isDeleted: true,
                    content: 'Message deleted',
                    deletedAt: ack.deletedAt,
                    reactions: [],
                    reactionCounts: { like: 0, love: 0, laugh: 0, fire: 0, clap: 0 },
                  }
                : m
            )
          );
          resolve(ack);
        } else {
          // Fallback to REST API
          try {
            const res = await messageService.deleteMessage(messageId);
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? res.data.message : m))
            );
            resolve(res);
          } catch (restErr) {
            reject(restErr);
          }
        }
      });
    });
  };

  // Handle reporting message
  const handleReportMessage = async (messageId, { reason, notes }) => {
    return await messageService.reportMessage(messageId, { reason, notes });
  };

  // Handle pin / unpin message (Admin only)
  const handleTogglePin = async (messageId, shouldPin) => {
    try {
      if (shouldPin) {
        socketService.pinMessage(messageId, async (ack) => {
          if (!ack || !ack.success) {
            try {
              await pinMessage(messageId);
            } catch (restErr) {
              setError(restErr.message || 'Failed to pin message.');
            }
          }
        });
      } else {
        socketService.unpinMessage(messageId, async (ack) => {
          if (!ack || !ack.success) {
            try {
              await unpinMessage(messageId);
            } catch (restErr) {
              setError(restErr.message || 'Failed to unpin message.');
            }
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update message pin state.');
    }
  };

  // Handle Enter / Shift + Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInputContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const isGlobal = room?.type === 'global';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Chat Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#080b12]/95 backdrop-blur-md border-b border-white/[0.08] shadow-md shadow-black/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Return & Room Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                  isGlobal ? 'from-blue-600 to-cyan-600' : 'from-violet-600 to-indigo-600'
                } p-[1px] flex items-center justify-center flex-shrink-0`}
              >
                <div className="w-full h-full bg-[#0a0f1d] rounded-[11px] flex items-center justify-center">
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
                  <span
                    className={`hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isGlobal
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                    }`}
                  >
                    {isGlobal ? 'Global' : room?.allowedYear}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  {room?.description || 'Prof. S.N. Bose Boys Hostel Community'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Socket Connection Pill & Notifications & User Persona */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* Socket Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
                socketStatus === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : socketStatus === 'connecting'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : socketStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-rose-400'
                }`}
              />
              <span className="capitalize">{socketStatus}</span>
            </div>

            {/* User Anonymous Pill */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-xl text-xs font-semibold">
              <span className="text-base">{user?.anonymousAvatar}</span>
              <span className="text-slate-200">{user?.anonymousName}</span>
              <span className="text-[10px] font-mono text-cyan-300">({user?.year})</span>
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
        <div className="flex-1 bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl relative min-h-[480px]">
          
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
                      <span className="text-base flex-shrink-0">
                        {pMsg.sender?.anonymousAvatar || '🎭'}
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
                        className="text-[10px] text-slate-400 hover:text-rose-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex-shrink-0"
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
                <div className="inline-flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-mono">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Your real name is not displayed to other students</span>
                </div>
              </div>
            )}

            {/* Messages List Rendered via MessageBubble */}
            {!loading &&
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUser={user}
                  onReactionToggle={handleReactionToggle}
                  onDeleteMessage={handleDeleteMessage}
                  onReportMessage={handleReportMessage}
                  onTogglePin={handleTogglePin}
                />
              ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Box */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-2">
            
            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputContent}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type an anonymous message in ${room?.name || 'this room'}... (Enter to send)`}
                  maxLength={1000}
                  disabled={loading || !room}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 resize-none transition-colors max-h-32 disabled:opacity-50"
                />

                <span className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-mono">
                  {inputContent.length}/1000
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputContent.trim() || sending || loading || !room}
                className="h-[46px] w-[46px] rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
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

        </div>

      </div>

    </div>
  );
};

export default ChatPage;
