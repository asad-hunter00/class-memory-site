import { io } from 'socket.io-client';
import { SERVER_URL, getToken } from './api.js';

let socket = null;

export function connectSocket() {
  if (socket) return socket;
  socket = io(SERVER_URL, { auth: (cb) => cb({ token: getToken() }), transports: ['websocket', 'polling'] });
  return socket;
}
export function getSocket() { return socket; }
export function disconnectSocket() { if (socket) { socket.disconnect(); socket = null; } }
