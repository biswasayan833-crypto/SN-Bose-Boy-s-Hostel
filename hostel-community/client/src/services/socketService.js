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

