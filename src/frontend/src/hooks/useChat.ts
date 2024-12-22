import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import * as chatService from '@/services/chatService';
import {
  Chat,
  ChatMessage,
  ChatMessageRequest,
  ChatFilter,
  ChatStats,
  ChatReaction,
  ChatNotification,
  ChatParticipant,
  ChatMediaUploadProgress,
} from '@/types/chat';
import { useAuth } from './useAuth';

export const useChat = (chatId?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [uploadProgress, setUploadProgress] = useState<ChatMediaUploadProgress | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // Socket.io initialisieren
  useEffect(() => {
    if (user) {
      const newSocket = chatService.initializeSocket(user.token);
      setSocket(newSocket);

      return () => {
        chatService.disconnectSocket();
      };
    }
  }, [user]);

  // Socket Event Listener
  useEffect(() => {
    if (socket) {
      // Neue Nachricht empfangen
      socket.on('message', (message: ChatMessage) => {
        queryClient.setQueryData(
          ['chat-messages', message.chatId],
          (old: any) => {
            if (!old) return { messages: [message] };
            return {
              ...old,
              messages: [...old.messages, message],
            };
          }
        );
      });

      // Tipp-Status empfangen
      socket.on('typing', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
        setIsTyping(isTyping);
      });

      // Nachrichtenstatus aktualisiert
      socket.on('messageStatus', ({ messageId, status }: { messageId: string; status: string }) => {
        queryClient.setQueryData(['chat-messages', chatId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg: ChatMessage) =>
              msg.id === messageId ? { ...msg, status } : msg
            ),
          };
        });
      });
    }
  }, [socket, queryClient, chatId]);

  // Chat abrufen
  const {
    data: chat,
    isLoading: isChatLoading,
    error: chatError,
  } = useQuery<Chat>(
    ['chat', chatId],
    () => chatService.getChat(chatId!),
    {
      enabled: !!chatId,
      staleTime: 1000 * 60, // 1 Minute
    }
  );

  // Chatnachrichten abrufen
  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    ['chat-messages', chatId],
    ({ pageParam = 1 }) =>
      chatService.getChatMessages(chatId!, pageParam),
    {
      enabled: !!chatId,
      getNextPageParam: (lastPage) =>
        lastPage.currentPage < lastPage.totalPages
          ? lastPage.currentPage + 1
          : undefined,
      staleTime: 1000 * 30, // 30 Sekunden
    }
  );

  // Nachricht senden
  const sendMessageMutation = useMutation(
    (data: ChatMessageRequest) => chatService.sendMessage(data),
    {
      onSuccess: (message) => {
        queryClient.setQueryData(
          ['chat-messages', message.chatId],
          (old: any) => {
            if (!old) return { messages: [message] };
            return {
              ...old,
              messages: [...old.messages, message],
            };
          }
        );
        enqueueSnackbar(t('chat.messageSent'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('chat.messageError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Nachricht löschen
  const deleteMessageMutation = useMutation(
    (messageId: string) => chatService.deleteMessage(messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', chatId]);
        enqueueSnackbar(t('chat.messageDeleted'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('chat.deleteError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Chat-Verlauf löschen
  const clearHistoryMutation = useMutation(
    (id: string) => chatService.clearChatHistory(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', chatId]);
        enqueueSnackbar(t('chat.historyCleared'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('chat.clearError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Reaktion hinzufügen
  const addReactionMutation = useMutation(
    (reaction: ChatReaction) => chatService.addReaction(reaction),
    {
      onSuccess: (message) => {
        queryClient.setQueryData(
          ['chat-messages', message.chatId],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((msg: ChatMessage) =>
                msg.id === message.id ? message : msg
              ),
            };
          }
        );
        enqueueSnackbar(t('chat.reactionAdded'), { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error.response?.data?.message || t('chat.reactionError'),
          { variant: 'error' }
        );
      },
    }
  );

  // Tipp-Status senden
  const sendTypingStatus = (isTyping: boolean) => {
    if (socket && chatId) {
      chatService.sendTypingStatus(chatId, isTyping);
    }
  };

  // Nachrichten als gelesen markieren
  const markAsRead = async (messageIds: string[]) => {
    if (chatId) {
      await chatService.markMessagesAsRead(chatId, messageIds);
      queryClient.invalidateQueries(['chat', chatId]);
    }
  };

  // Wrapper-Funktionen
  const sendMessage = async (data: ChatMessageRequest) => {
    return sendMessageMutation.mutateAsync(data);
  };

  const deleteMessage = async (messageId: string) => {
    return deleteMessageMutation.mutateAsync(messageId);
  };

  const clearHistory = async () => {
    if (chatId) {
      return clearHistoryMutation.mutateAsync(chatId);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    return addReactionMutation.mutateAsync({ messageId, emoji });
  };

  return {
    chat,
    messages,
    isTyping,
    uploadProgress,
    isChatLoading,
    isMessagesLoading,
    chatError,
    messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage,
    deleteMessage,
    clearHistory,
    addReaction,
    sendTypingStatus,
    markAsRead,
    isSending: sendMessageMutation.isLoading,
    isDeleting: deleteMessageMutation.isLoading,
    isClearing: clearHistoryMutation.isLoading,
    isReacting: addReactionMutation.isLoading,
  };
};