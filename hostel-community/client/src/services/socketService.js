import { io } from 'socket.io-client';

const TOKEN_KEY = 'snbose_auth_token';

class SocketService {
  constructor() {
    this.socket = null;
    this.statusListeners = new Set();
    this.connectionState = 'disconnected'; // 'connected' | 'connecting' | 'disconnected'
  }

  getConnectionState() {
    return this.connectionState;
  }

  onStatusChange(listener) {
    this.statusListeners.add(listener);
    listener(this.connectionState);
    return () => this.statusListeners.delete(listener);
  }

  _setStatus(newState) {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.statusListeners.forEach((fn) => fn(newState));
    }
  }

  connect() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      this._setStatus('disconnected');
      return null;
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this._setStatus('connecting');

    // In dev, connect to backend port 5000 directly or via origin
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this._setStatus('connected');
    });

    this.socket.on('disconnect', () => {
      this._setStatus('disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      this._setStatus('disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._setStatus('disconnected');
  }

  joinRoom(roomIdOrSlug, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('join_room', { roomId: roomIdOrSlug, roomSlug: roomIdOrSlug }, callback);
    }
  }

  leaveRoom(roomId, callback) {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId }, callback);
    }
  }

  sendMessage(roomId, content, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('send_message', { roomId, content }, callback);
    }
  }

  addReaction(messageId, type, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('add_reaction', { messageId, type }, callback);
    }
  }

  removeReaction(messageId, type, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('remove_reaction', { messageId, type }, callback);
    }
  }

  deleteMessage(messageId, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('delete_message', { messageId }, callback);
    }
  }

  markRoomRead(roomId, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('mark_room_read', { roomId }, callback);
    }
  }

  onReactionUpdated(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('reaction_updated', handler);
      return () => this.socket.off('reaction_updated', handler);
    }
    return () => {};
  }

  onMessageDeleted(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('message_deleted', handler);
      return () => this.socket.off('message_deleted', handler);
    }
    return () => {};
  }

  onNewMessage(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('new_message', handler);
      return () => this.socket.off('new_message', handler);
    }
    return () => {};
  }

  onNotificationNew(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('notification:new', handler);
      return () => this.socket.off('notification:new', handler);
    }
    return () => {};
  }

  pinMessage(messageId, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('pin_message', { messageId }, callback);
    }
  }

  unpinMessage(messageId, callback) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.emit('unpin_message', { messageId }, callback);
    }
  }

  onAnnouncementNew(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('announcement:new', handler);
      return () => this.socket.off('announcement:new', handler);
    }
    return () => {};
  }

  onAnnouncementUpdated(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('announcement:updated', handler);
      return () => this.socket.off('announcement:updated', handler);
    }
    return () => {};
  }

  onAnnouncementDeleted(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('announcement:deleted', handler);
      return () => this.socket.off('announcement:deleted', handler);
    }
    return () => {};
  }

  onPollNew(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('poll:new', handler);
      return () => this.socket.off('poll:new', handler);
    }
    return () => {};
  }

  onPollUpdated(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('poll:updated', handler);
      return () => this.socket.off('poll:updated', handler);
    }
    return () => {};
  }

  onPollClosed(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('poll:closed', handler);
      return () => this.socket.off('poll:closed', handler);
    }
    return () => {};
  }

  onMessagePinned(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('message:pinned', handler);
      return () => this.socket.off('message:pinned', handler);
    }
    return () => {};
  }

  onMessageUnpinned(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('message:unpinned', handler);
      return () => this.socket.off('message:unpinned', handler);
    }
    return () => {};
  }

  onRoomUnreadUpdated(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('room:unread_updated', handler);
      return () => this.socket.off('room:unread_updated', handler);
    }
    return () => {};
  }

  onRoomError(handler) {
    if (!this.socket) this.connect();
    if (this.socket) {
      this.socket.on('room_error', handler);
      return () => this.socket.off('room_error', handler);
    }
    return () => {};
  }
}

export const socketService = new SocketService();
export default socketService;

