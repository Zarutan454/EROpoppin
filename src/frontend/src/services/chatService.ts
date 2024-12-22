import axios from 'axios';
import io from 'socket.io-client';
import {
  Chat,
  ChatMessage,
  ChatMessageRequest,
  ChatFilter,
  ChatStats,
  ChatReaction,
  ChatNotification,
  ChatParticipant,
} from '@/types/chat';

const API_URL = `${import.meta.env.VITE_API_URL}/chats`;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// WebSocket-Verbindung
let socket: any = null;

export const initializeSocket = (token: string) => {
  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Connected to chat server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from chat server');
  });

  return socket;
};

// Chat erstellen
export const createChat = async (
  participantIds: string[]
): Promise<Chat> => {
  const response = await axios.post(API_URL, { participantIds });
  return response.data;
};

// Chat abrufen
export const getChat = async (chatId: string): Promise<Chat> => {
  const response = await axios.get(`${API_URL}/${chatId}`);
  return response.data;
};

// Alle Chats eines Benutzers abrufen
export const getChats = async (
  filters: ChatFilter,
  page = 1,
  limit = 20
): Promise<{
  chats: Chat[];
  total: number;
  currentPage: number;
  totalPages: number;
}> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const response = await axios.get(`${API_URL}?${queryParams}`);
  return response.data;
};

// Chatnachrichten abrufen
export const getChatMessages = async (
  chatId: string,
  page = 1,
  limit = 50
): Promise<{
  messages: ChatMessage[];
  total: number;
  currentPage: number;
  totalPages: number;
}> => {
  const response = await axios.get(
    `${API_URL}/${chatId}/messages?page=${page}&limit=${limit}`
  );
  return response.data;
};

// Nachricht senden
export const sendMessage = async (
  messageData: ChatMessageRequest
): Promise<ChatMessage> => {
  if (messageData.media) {
    const formData = new FormData();
    formData.append('chatId', messageData.chatId);
    formData.append('receiverId', messageData.receiverId);
    formData.append('content', messageData.content);
    formData.append('contentType', messageData.contentType);
    if (messageData.replyTo) {
      formData.append('replyTo', messageData.replyTo);
    }
    formData.append('media', messageData.media);

    const response = await axios.post(
      `${API_URL}/messages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  const response = await axios.post(`${API_URL}/messages`, messageData);
  return response.data;
};

// Nachricht aktualisieren
export const updateMessage = async (
  messageId: string,
  content: string
): Promise<ChatMessage> => {
  const response = await axios.patch(`${API_URL}/messages/${messageId}`, {
    content,
  });
  return response.data;
};

// Nachricht löschen
export const deleteMessage = async (messageId: string): Promise<void> => {
  await axios.delete(`${API_URL}/messages/${messageId}`);
};

// Chat-Verlauf löschen
export const clearChatHistory = async (chatId: string): Promise<void> => {
  await axios.delete(`${API_URL}/${chatId}/messages`);
};

// Reaktion hinzufügen
export const addReaction = async (
  reaction: ChatReaction
): Promise<ChatMessage> => {
  const response = await axios.post(
    `${API_URL}/messages/${reaction.messageId}/reactions`,
    { emoji: reaction.emoji }
  );
  return response.data;
};

// Reaktion entfernen
export const removeReaction = async (
  messageId: string,
  emoji: string
): Promise<ChatMessage> => {
  const response = await axios.delete(
    `${API_URL}/messages/${messageId}/reactions/${emoji}`
  );
  return response.data;
};

// Chat archivieren
export const archiveChat = async (chatId: string): Promise<Chat> => {
  const response = await axios.post(`${API_URL}/${chatId}/archive`);
  return response.data;
};

// Chat wiederherstellen
export const unarchiveChat = async (chatId: string): Promise<Chat> => {
  const response = await axios.post(`${API_URL}/${chatId}/unarchive`);
  return response.data;
};

// Chat blockieren
export const blockChat = async (chatId: string): Promise<Chat> => {
  const response = await axios.post(`${API_URL}/${chatId}/block`);
  return response.data;
};

// Chat entsperren
export const unblockChat = async (chatId: string): Promise<Chat> => {
  const response = await axios.post(`${API_URL}/${chatId}/unblock`);
  return response.data;
};

// Chat-Einstellungen aktualisieren
export const updateChatSettings = async (
  chatId: string,
  settings: Partial<Chat['settings']>
): Promise<Chat> => {
  const response = await axios.patch(
    `${API_URL}/${chatId}/settings`,
    settings
  );
  return response.data;
};

// Nachrichten als gelesen markieren
export const markMessagesAsRead = async (
  chatId: string,
  messageIds: string[]
): Promise<void> => {
  await axios.post(`${API_URL}/${chatId}/read`, { messageIds });
};

// Chat-Statistiken abrufen
export const getChatStats = async (
  userId: string
): Promise<ChatStats> => {
  const response = await axios.get(`${API_URL}/stats/${userId}`);
  return response.data;
};

// Chat-Benachrichtigungen abrufen
export const getChatNotifications = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<{
  notifications: ChatNotification[];
  total: number;
  currentPage: number;
  totalPages: number;
}> => {
  const response = await axios.get(
    `${API_URL}/notifications/${userId}?page=${page}&limit=${limit}`
  );
  return response.data;
};

// Benachrichtigung als gelesen markieren
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  await axios.post(`${API_URL}/notifications/${notificationId}/read`);
};

// Chat-Teilnehmer aktualisieren
export const updateParticipant = async (
  chatId: string,
  userId: string,
  data: Partial<ChatParticipant>
): Promise<ChatParticipant> => {
  const response = await axios.patch(
    `${API_URL}/${chatId}/participants/${userId}`,
    data
  );
  return response.data;
};

// Tipp-Status senden
export const sendTypingStatus = (chatId: string, isTyping: boolean) => {
  if (socket) {
    socket.emit('typing', { chatId, isTyping });
  }
};

// Online-Status aktualisieren
export const updateOnlineStatus = (isOnline: boolean) => {
  if (socket) {
    socket.emit('status', { isOnline });
  }
};

// WebSocket-Event-Listener hinzufügen
export const addSocketListener = (
  event: string,
  callback: (data: any) => void
) => {
  if (socket) {
    socket.on(event, callback);
  }
};

// WebSocket-Event-Listener entfernen
export const removeSocketListener = (
  event: string,
  callback: (data: any) => void
) => {
  if (socket) {
    socket.off(event, callback);
  }
};

// Socket-Verbindung trennen
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};