import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

interface ChatMessage {
  content: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
}

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private typingHandlers: ((data: { from: string }) => void)[] = [];
  private statusHandlers: ((data: { userId: string, status: 'online' | 'offline' }) => void)[] = [];

  private constructor() {}

  static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Verbindungsfehler zum Chat-Server');
    });

    this.socket.on('message', (message: ChatMessage) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('typing', (data: { from: string }) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('user_online', (data: { userId: string }) => {
      this.statusHandlers.forEach(handler => handler({ ...data, status: 'online' }));
    });

    this.socket.on('user_offline', (data: { userId: string }) => {
      this.statusHandlers.forEach(handler => handler({ ...data, status: 'offline' }));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      toast.warning('Chat-Verbindung getrennt');
    });
  }

  sendMessage(message: ChatMessage) {
    if (!this.socket?.connected) {
      toast.error('Keine Verbindung zum Chat-Server');
      return;
    }

    this.socket.emit('message', message);
  }

  sendTyping(to: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { to });
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: (data: { from: string }) => void) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onStatusChange(handler: (data: { userId: string, status: 'online' | 'offline' }) => void) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketClient.getInstance();