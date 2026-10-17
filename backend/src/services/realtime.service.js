import { Server } from 'socket.io';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/env.js';

let io;

export function initializeRealtime(server) {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };

    return authenticate(req, {}, (error) => {
      if (error) return next(new Error('Unauthorized'));
      socket.data.userId = req.user.userId;
      return next();
    });
  });

  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }
    socket.on('mentorship:subscribe', () => socket.join('mentorship:directory'));
  });

  return io;
}

export function publishNotification(notification) {
  if (!io || !notification?.userId) return;

  const source = typeof notification.toObject === 'function'
    ? notification.toObject()
    : notification;
  const { userId, ...payload } = source;

  io.to(`user:${userId.toString()}`).emit('notification:new', {
    ...payload,
    _id: payload._id?.toString(),
    entityId: payload.entityId?.toString(),
    createdAt: payload.createdAt || new Date(),
  });
}

export function publishConsultationRatingUpdate(ratingUpdate) {
  io?.to('mentorship:directory').emit('consultation:rating-updated', ratingUpdate);
}

export function publishWebinarLobbyUpdate(userId, roomCode) {
  if (!io || !userId || !roomCode) return;
  io.to(`user:${userId.toString()}`).emit('webinar:lobby-updated', { roomCode });
}

export function publishWebinarAdmission(userId, roomCode, status) {
  if (!io || !userId || !roomCode) return;
  io.to(`user:${userId.toString()}`).emit('webinar:admission-updated', { roomCode, status });
}
