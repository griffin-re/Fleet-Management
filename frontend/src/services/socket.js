import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const socketService = {
  connect: (token) => {
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
    }
  },

  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emit: (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  },

  onConvoyUpdate: (callback) => {
    if (socket) socket.on('convoy:update', callback);
  },

  onAlert: (callback) => {
    if (socket) socket.on('alert:new', callback);
  },

  onVehicleUpdate: (callback) => {
    if (socket) socket.on('vehicle:update', callback);
  },

  onMessage: (callback) => {
    if (socket) socket.on('message:new', callback);
  },

  onIncident: (callback) => {
    if (socket) socket.on('incident:new', callback);
  },
};

export default socketService;
