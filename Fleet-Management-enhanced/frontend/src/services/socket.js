import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const socketService = {
  connect: (token) => {
    // FIXED: prevent duplicate connections
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // FIXED: use websocket first, fall back to polling
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.info('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // FIXED: guard against calls before socket is initialized
  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    } else {
      console.warn(`[Socket] Cannot subscribe to "${event}" — socket not connected`);
    }
  },

  off: (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emit: (event, data) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`[Socket] Cannot emit "${event}" — socket not connected`);
    }
  },

  isConnected: () => socket?.connected ?? false,

  onConvoyUpdate: (callback) => { if (socket) socket.on('convoy:update', callback); },
  offConvoyUpdate: (callback) => { if (socket) socket.off('convoy:update', callback); },

  onAlert: (callback) => { if (socket) socket.on('alert:new', callback); },
  offAlert: (callback) => { if (socket) socket.off('alert:new', callback); },

  onVehicleUpdate: (callback) => { if (socket) socket.on('vehicle:update', callback); },
  offVehicleUpdate: (callback) => { if (socket) socket.off('vehicle:update', callback); },

  onMessage: (callback) => { if (socket) socket.on('message:new', callback); },
  offMessage: (callback) => { if (socket) socket.off('message:new', callback); },

  onIncident: (callback) => { if (socket) socket.on('incident:new', callback); },
  offIncident: (callback) => { if (socket) socket.off('incident:new', callback); },
};

export default socketService;
