import { useEffect, useCallback, useState } from 'react';
import socketService from '../services/socket.service';

interface ChatMessage {
  content: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
}

interface UseSocketProps {
  token: string;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (data: { from: string }) => void;
  onStatusChange?: (data: { userId: string; status: 'online' | 'offline' }) => void;
}

export const useSocket = ({ token, onMessage, onTyping, onStatusChange }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketService.connect(token);
    setIsConnected(true);

    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [token]);

  useEffect(() => {
    if (!onMessage) return;
    const cleanup = socketService.onMessage(onMessage);
    return cleanup;
  }, [onMessage]);

  useEffect(() => {
    if (!onTyping) return;
    const cleanup = socketService.onTyping(onTyping);
    return cleanup;
  }, [onTyping]);

  useEffect(() => {
    if (!onStatusChange) return;
    const cleanup = socketService.onStatusChange(onStatusChange);
    return cleanup;
  }, [onStatusChange]);

  const sendMessage = useCallback((message: ChatMessage) => {
    socketService.sendMessage(message);
  }, []);

  const sendTyping = useCallback((to: string) => {
    socketService.sendTyping(to);
  }, []);

  return {
    isConnected,
    sendMessage,
    sendTyping
  };
};