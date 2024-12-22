export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  contentType: 'text' | 'image' | 'emoji';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  reactions?: {
    userId: string;
    emoji: string;
  }[];
  replyTo?: {
    messageId: string;
    content: string;
  };
  media?: {
    url: string;
    type: string;
    thumbnailUrl?: string;
    size?: number;
  };
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: {
    [userId: string]: number;
  };
  status: 'active' | 'archived' | 'blocked';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  settings: {
    notifications: boolean;
    encryption: boolean;
    autoDelete?: number; // Zeit in Stunden
  };
}

export interface ChatParticipant {
  id: string;
  userId: string;
  chatId: string;
  status: 'active' | 'inactive' | 'blocked';
  lastSeen: string;
  typing: boolean;
  role: 'admin' | 'member';
  settings: {
    notifications: boolean;
    muteUntil?: string;
  };
}

export interface ChatMessageRequest {
  chatId: string;
  receiverId: string;
  content: string;
  contentType: 'text' | 'image' | 'emoji';
  replyTo?: string;
  media?: File;
}

export interface ChatReaction {
  messageId: string;
  emoji: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  chatId: string;
  messageId: string;
  type: 'message' | 'reaction' | 'mention';
  read: boolean;
  createdAt: string;
}

export interface ChatFilter {
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ChatStats {
  totalMessages: number;
  activeChats: number;
  averageResponseTime: number;
  messagesByDate: {
    date: string;
    count: number;
  }[];
  mediaUsage: {
    total: number;
    byType: {
      [key: string]: number;
    };
  };
}

export interface EmojiCategory {
  id: string;
  name: string;
  emojis: {
    id: string;
    unicode: string;
    name: string;
    keywords: string[];
  }[];
}

export interface ChatMediaUploadProgress {
  messageId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ChatEncryption {
  enabled: boolean;
  publicKey: string;
  privateKey: string;
}