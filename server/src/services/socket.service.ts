import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';
import { logger } from '../utils/logger';

interface ChatMessage {
  content: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
}

interface User {
  id: string;
  socketId: string;
}

class SocketService {
  private io: Server;
  private users: Map<string, User> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = await verifyToken(token);
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);

      socket.on('message', (message: ChatMessage) => this.handleMessage(socket, message));
      socket.on('typing', (data: { to: string }) => this.handleTyping(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  private handleConnection(socket: Socket) {
    const userId = socket.data.user.id;
    this.users.set(userId, { id: userId, socketId: socket.id });
    
    logger.info(`User connected: ${userId}`);
    
    // Broadcast user online status
    socket.broadcast.emit('user_online', { userId });
  }

  private handleMessage(socket: Socket, message: ChatMessage) {
    const user = this.users.get(message.to);
    
    if (user) {
      // Send to specific user
      this.io.to(user.socketId).emit('message', {
        ...message,
        from: socket.data.user.id
      });
    }

    // Store message in database (implement this)
    this.storeMessage(message);
  }

  private handleTyping(socket: Socket, data: { to: string }) {
    const user = this.users.get(data.to);
    
    if (user) {
      this.io.to(user.socketId).emit('typing', {
        from: socket.data.user.id
      });
    }
  }

  private handleDisconnect(socket: Socket) {
    const userId = socket.data.user.id;
    this.users.delete(userId);
    
    logger.info(`User disconnected: ${userId}`);
    
    // Broadcast user offline status
    this.io.emit('user_offline', { userId });
  }

  private async storeMessage(message: ChatMessage) {
    try {
      // Implement message storage in database
      // await prisma.message.create({
      //   data: {
      //     content: message.content,
      //     fromId: message.from,
      //     toId: message.to,
      //     type: message.type,
      //   }
      // });
    } catch (error) {
      logger.error('Error storing message:', error);
    }
  }
}

export default SocketService;