import { createContext, useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSnackbar } from 'notistack';

import { useAuth } from '@/hooks/useAuth';
import { Message } from '@/types/message';
import { Notification } from '@/types/notification';

interface SocketContextValue {
  isConnected: boolean;
  socket: Socket | null;
  sendMessage: (recipientId: string, content: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  typing: (roomId: string, isTyping: boolean) => void;
}

export const SocketContext = createContext<SocketContextValue>({
  isConnected: false,
  socket: null,
  sendMessage: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  typing: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Socket.IO Verbindung initialisieren
  useEffect(() => {
    if (isAuthenticated && user) {
      const socketInstance = io(process.env.SOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        enqueueSnackbar('Real-time connection established', {
          variant: 'success',
          autoHideDuration: 2000,
        });
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        enqueueSnackbar('Connection error. Trying to reconnect...', {
          variant: 'error',
        });
      });

      // Nachrichten-Handler
      socketInstance.on('new_message', (message: Message) => {
        // Neue Nachricht im Chat-System verarbeiten
        console.log('New message received:', message);
        if (message.sender.id !== user.id) {
          enqueueSnackbar(`New message from ${message.sender.name}`, {
            variant: 'info',
          });
        }
      });

      // Benachrichtigungs-Handler
      socketInstance.on('notification', (notification: Notification) => {
        console.log('New notification:', notification);
        enqueueSnackbar(notification.message, {
          variant: notification.type || 'default',
        });
      });

      // Typing-Status-Handler
      socketInstance.on('typing_status', ({ roomId, userId, isTyping }) => {
        // Typing-Status im Chat-System aktualisieren
        console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in room ${roomId}`);
      });

      // Online-Status-Updates
      socketInstance.on('user_status', ({ userId, status }) => {
        // Online-Status von Benutzern aktualisieren
        console.log(`User ${userId} is now ${status}`);
      });

      setSocket(socketInstance);

      // Cleanup beim Unmount
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [isAuthenticated, user, enqueueSnackbar]);

  // Nachricht senden
  const sendMessage = useCallback((recipientId: string, content: string) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        recipientId,
        content,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('Socket not connected');
      enqueueSnackbar('Connection error. Please try again.', {
        variant: 'error',
      });
    }
  }, [socket, isConnected, enqueueSnackbar]);

  // Chatraum betreten
  const joinRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
    }
  }, [socket, isConnected]);

  // Chatraum verlassen
  const leaveRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomId);
    }
  }, [socket, isConnected]);

  // Typing-Status senden
  const typing = useCallback((roomId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        roomId,
        isTyping,
      });
    }
  }, [socket, isConnected]);

  // Kontext-Wert erstellen
  const value = {
    isConnected,
    socket,
    sendMessage,
    joinRoom,
    leaveRoom,
    typing,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;