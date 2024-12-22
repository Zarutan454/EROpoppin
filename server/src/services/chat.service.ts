import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { RedisService } from './redis';
import { NotificationService } from './notifications';
import * as crypto from 'crypto';
import * as sharp from 'sharp';

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'emoji';
  mediaUrl?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    width?: number;
    height?: number;
    duration?: number;
  };
  replyTo?: string;
  reactions?: {
    [userId: string]: string; // emoji
  };
  readBy: string[];
  deletedFor: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  isArchived: { [userId: string]: boolean };
  settings: {
    encryption: boolean;
    autoDeletion?: number; // time in seconds
    notifications: { [userId: string]: boolean };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface MediaUploadResult {
  url: string;
  metadata: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
}

@Injectable()
export class ChatService {
  private readonly encryptionKey: Buffer;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  constructor(
    @InjectRepository('chat_messages')
    private messageRepo: Repository<ChatMessage>,
    @InjectRepository('chat_rooms')
    private roomRepo: Repository<ChatRoom>,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService
  ) {
    this.encryptionKey = Buffer.from(process.env.CHAT_ENCRYPTION_KEY, 'hex');
  }

  // Message Management
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    mediaUrl?: string,
    metadata?: ChatMessage['metadata'],
    replyTo?: string
  ): Promise<ChatMessage> {
    // Get or create chat room
    const roomId = await this.getOrCreateChatRoom(senderId, receiverId);

    // Encrypt message content
    const encryptedContent = this.encryptMessage(content);

    const message = await this.messageRepo.save({
      senderId,
      receiverId,
      content: encryptedContent,
      type,
      mediaUrl,
      metadata,
      replyTo,
      readBy: [senderId],
      deletedFor: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update chat room's last message
    await this.roomRepo.update(roomId, {
      lastMessage: message,
      updatedAt: new Date()
    });

    // Send notification
    await this.sendMessageNotification(message);

    return {
      ...message,
      content: this.decryptMessage(message.content) // Decrypt for response
    };
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Add user to deletedFor array
    message.deletedFor.push(userId);
    await this.messageRepo.save(message);
  }

  async deleteChat(roomId: string, userId: string): Promise<void> {
    // Mark all messages as deleted for this user
    await this.messageRepo.update(
      { roomId },
      { deletedFor: () => `array_append(deletedFor, '${userId}')` }
    );

    // Archive chat room for this user
    await this.roomRepo.update(roomId, {
      isArchived: { [userId]: true }
    });
  }

  // Media Management
  async uploadMedia(
    file: Express.Multer.File,
    senderId: string
  ): Promise<MediaUploadResult> {
    // Validate file
    if (file.size > this.maxFileSize) {
      throw new Error('File size exceeds limit');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }

    let processedFile = file.buffer;
    let metadata: MediaUploadResult['metadata'] = {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    };

    // Process image if applicable
    if (file.mimetype.startsWith('image/')) {
      const processed = await this.processImage(file.buffer);
      processedFile = processed.buffer;
      metadata = {
        ...metadata,
        ...processed.metadata
      };
    }

    // Upload to storage (implementation depends on your storage solution)
    const url = await this.uploadToStorage(processedFile, metadata);

    return { url, metadata };
  }

  private async processImage(buffer: Buffer): Promise<{
    buffer: Buffer;
    metadata: { width: number; height: number };
  }> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if too large
    if (metadata.width > 2000 || metadata.height > 2000) {
      image.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Compress
    image.jpeg({ quality: 80 });

    return {
      buffer: await image.toBuffer(),
      metadata: {
        width: metadata.width,
        height: metadata.height
      }
    };
  }

  // Emoji & Reactions
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    message.reactions = {
      ...message.reactions,
      [userId]: emoji
    };

    await this.messageRepo.save(message);
  }

  async removeReaction(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId }
    });

    if (!message || !message.reactions[userId]) {
      return;
    }

    delete message.reactions[userId];
    await this.messageRepo.save(message);
  }

  // Chat Room Management
  async getOrCreateChatRoom(
    userId1: string,
    userId2: string
  ): Promise<string> {
    const existingRoom = await this.roomRepo.findOne({
      where: {
        participants: {
          $all: [userId1, userId2]
        }
      }
    });

    if (existingRoom) {
      return existingRoom.id;
    }

    const newRoom = await this.roomRepo.save({
      participants: [userId1, userId2],
      isArchived: {},
      settings: {
        encryption: true,
        notifications: {
          [userId1]: true,
          [userId2]: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return newRoom.id;
  }

  async updateChatSettings(
    roomId: string,
    userId: string,
    settings: Partial<ChatRoom['settings']>
  ): Promise<void> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId }
    });

    if (!room || !room.participants.includes(userId)) {
      throw new Error('Chat room not found or access denied');
    }

    room.settings = {
      ...room.settings,
      ...settings
    };

    await this.roomRepo.save(room);
  }

  // Message Encryption
  private encryptMessage(content: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      content: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  private decryptMessage(encryptedData: string): string {
    const { iv, content, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Notifications
  private async sendMessageNotification(message: ChatMessage): Promise<void> {
    const room = await this.roomRepo.findOne({
      where: {
        participants: {
          $all: [message.senderId, message.receiverId]
        }
      }
    });

    if (!room?.settings.notifications[message.receiverId]) {
      return;
    }

    await this.notificationService.notify({
      userId: message.receiverId,
      type: 'new_message',
      title: 'Neue Nachricht',
      message: message.type === 'text' 
        ? this.decryptMessage(message.content)
        : `Neue ${message.type === 'image' ? 'Bild' : 'Datei'}`,
      data: {
        messageId: message.id,
        senderId: message.senderId,
        type: message.type
      }
    });
  }

  // Socket Management
  handleSocketConnection(socket: Socket): void {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Join user's room
    socket.join(`user:${userId}`);

    // Set online status
    this.setUserStatus(userId, true);

    // Handle typing events
    socket.on('typing:start', (receiverId: string) => {
      socket.to(`user:${receiverId}`).emit('typing:start', userId);
    });

    socket.on('typing:stop', (receiverId: string) => {
      socket.to(`user:${receiverId}`).emit('typing:stop', userId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.setUserStatus(userId, false);
    });
  }

  private async setUserStatus(userId: string, online: boolean): Promise<void> {
    await this.redisService.set(
      `user:${userId}:status`,
      online ? 'online' : 'offline'
    );

    // Notify user's contacts
    const rooms = await this.roomRepo.find({
      where: {
        participants: userId
      }
    });

    for (const room of rooms) {
      const otherParticipant = room.participants.find(p => p !== userId);
      if (otherParticipant) {
        this.notificationService.notifySocket(otherParticipant, 'user:status', {
          userId,
          status: online ? 'online' : 'offline'
        });
      }
    }
  }
}
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessage, ChatRoom } from '../types/chat';
import { NotificationService } from './notifications';
import { redis } from './redis';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatService {
  @WebSocketServer() server: Server;
  private activeUsers: Map<string, Socket> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();

  constructor(private notificationService: NotificationService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      this.activeUsers.set(userId, client);
      await this.updateUserStatus(userId, 'online');
      await this.joinUserRooms(userId, client);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.activeUsers.delete(userId);
      await this.updateUserStatus(userId, 'offline');
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() message: ChatMessage,
    client: Socket,
  ): Promise<void> {
    const roomId = this.getRoomId(message.from, message.to);
    await this.saveMessage(message);
    
    this.server.to(roomId).emit('new_message', message);
    
    // Send notification if user is offline
    if (!this.activeUsers.has(message.to)) {
      await this.notificationService.send({
        user_id: message.to,
        title: 'New Message',
        message: `You have a new message from ${message.from}`,
        type: 'chat',
        data: { messageId: message.id, from: message.from }
      });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, data: { roomId: string, userId: string }): void {
    client.broadcast.to(data.roomId).emit('user_typing', {
      userId: data.userId,
      roomId: data.roomId
    });
  }

  private async saveMessage(message: ChatMessage): Promise<void> {
    const roomId = this.getRoomId(message.from, message.to);
    await redis.lpush(`chat:${roomId}`, JSON.stringify(message));
    // Trim to last 100 messages
    await redis.ltrim(`chat:${roomId}`, 0, 99);
  }

  async getChatHistory(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await redis.lrange(`chat:${roomId}`, 0, limit - 1);
    return messages.map(msg => JSON.parse(msg));
  }

  private getRoomId(user1: string, user2: string): string {
    return [user1, user2].sort().join(':');
  }

  private getUserIdFromSocket(socket: Socket): string | null {
    return socket.handshake.auth.userId || null;
  }

  private async updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<void> {
    await redis.hset('user_status', userId, status);
    this.server.emit('user_status_change', { userId, status });
  }

  private async joinUserRooms(userId: string, client: Socket): Promise<void> {
    const rooms = await this.getUserRooms(userId);
    rooms.forEach(roomId => {
      client.join(roomId);
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId).add(roomId);
    });
  }

  private async getUserRooms(userId: string): Promise<string[]> {
    // Implement room retrieval logic from database
    return [];
  }
}