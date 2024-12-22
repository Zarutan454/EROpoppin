import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { redis } from './redis';
import { logger } from '../utils/logger';
import { prisma } from '../db';

let io: Server;

interface AuthenticatedSocket extends Socket {
  user?: any;
}

export const initializeWebSockets = (server: Server) => {
  io = server;

  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`bl_${token}`);
      if (isBlacklisted) {
        return next(new Error('Token has been invalidated'));
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.status === 'suspended') {
        return next(new Error('Account suspended'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('Client connected:', {
      socketId: socket.id,
      userId: socket.user?.id,
    });

    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    // Handle joining conversation rooms
    socket.on('join:conversation', async (conversationId: string) => {
      try {
        // Verify user is part of the conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { user1_id: socket.user.id },
              { user2_id: socket.user.id },
            ],
          },
        });

        if (!conversation) {
          socket.emit('error', 'Not authorized to join this conversation');
          return;
        }

        socket.join(`conversation:${conversationId}`);
        socket.emit('joined:conversation', conversationId);

        // Notify other user that this user is online
        const otherUserId =
          conversation.user1_id === socket.user.id
            ? conversation.user2_id
            : conversation.user1_id;

        io.to(`user:${otherUserId}`).emit('user:online', {
          userId: socket.user.id,
          conversationId,
        });
      } catch (error) {
        logger.error('Join conversation error:', error);
        socket.emit('error', 'Failed to join conversation');
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('left:conversation', conversationId);
    });

    // Handle typing indicators
    socket.on('typing:start', (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit('user:typing', { userId: socket.user.id });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit('user:stopped-typing', { userId: socket.user.id });
    });

    // Handle presence
    socket.on('presence:update', async (status: string) => {
      try {
        await prisma.user.update({
          where: { id: socket.user.id },
          data: {
            online_status: status,
            last_seen: new Date(),
          },
        });

        // Notify user's contacts
        const conversations = await prisma.conversation.findMany({
          where: {
            OR: [
              { user1_id: socket.user.id },
              { user2_id: socket.user.id },
            ],
          },
          select: {
            id: true,
            user1_id: true,
            user2_id: true,
          },
        });

        conversations.forEach((conversation) => {
          const otherUserId =
            conversation.user1_id === socket.user.id
              ? conversation.user2_id
              : conversation.user1_id;

          io.to(`user:${otherUserId}`).emit('user:presence-update', {
            userId: socket.user.id,
            status,
            lastSeen: new Date(),
          });
        });
      } catch (error) {
        logger.error('Presence update error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Update user's last seen
        await prisma.user.update({
          where: { id: socket.user.id },
          data: {
            online_status: 'offline',
            last_seen: new Date(),
          },
        });

        // Notify user's contacts
        const conversations = await prisma.conversation.findMany({
          where: {
            OR: [
              { user1_id: socket.user.id },
              { user2_id: socket.user.id },
            ],
          },
          select: {
            id: true,
            user1_id: true,
            user2_id: true,
          },
        });

        conversations.forEach((conversation) => {
          const otherUserId =
            conversation.user1_id === socket.user.id
              ? conversation.user2_id
              : conversation.user1_id;

          io.to(`user:${otherUserId}`).emit('user:offline', {
            userId: socket.user.id,
            lastSeen: new Date(),
          });
        });

        logger.info('Client disconnected:', {
          socketId: socket.id,
          userId: socket.user?.id,
        });
      } catch (error) {
        logger.error('Disconnect handler error:', error);
      }
    });
  });

  return io;
};

// Helper function to emit events to specific users
export const emitToUser = (userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Helper function to emit events to conversation participants
export const emitToConversation = (
  conversationId: string,
  event: string,
  data: any
) => {
  io.to(`conversation:${conversationId}`).emit(event, data);
};

// Helper function to broadcast to all connected clients
export const broadcast = (event: string, data: any) => {
  io.emit(event, data);
};

// Helper function to broadcast to all clients except sender
export const broadcastExcept = (
  socket: Socket,
  event: string,
  data: any
) => {
  socket.broadcast.emit(event, data);
};

export { io };