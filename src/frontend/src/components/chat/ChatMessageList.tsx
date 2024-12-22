import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  useTheme,
} from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { InfiniteData } from 'react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessageListProps {
  messages?: InfiniteData<{
    messages: ChatMessageType[];
    total: number;
    currentPage: number;
    totalPages: number;
  }>;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoadingMore: boolean;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onDeleteMessage,
  onAddReaction,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { ref, inView } = useInView({
    threshold: 0,
  });

  // Lade mehr Nachrichten, wenn der Benutzer nach oben scrollt
  React.useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!messages?.pages[0].messages.length) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Typography color="text.secondary">
          Noch keine Nachrichten
        </Typography>
      </Box>
    );
  }

  const allMessages = messages.pages.flatMap((page) => page.messages);

  // Gruppiere Nachrichten nach Datum
  const messagesByDate = allMessages.reduce((groups, message) => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as { [key: string]: ChatMessageType[] });

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column-reverse',
      }}
    >
      <AnimatePresence>
        {Object.entries(messagesByDate).map(([date, messages]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  bgcolor: 'background.paper',
                  px: 2,
                  py: 0.5,
                  borderRadius: 4,
                  color: 'text.secondary',
                }}
              >
                {format(new Date(date), 'EEEE, d. MMMM yyyy', {
                  locale: de,
                })}
              </Typography>
            </Box>

            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                showAvatar={
                  index === 0 ||
                  messages[index - 1].senderId !== message.senderId
                }
                onDelete={() => onDeleteMessage(message.id)}
                onReaction={(emoji) => onAddReaction(message.id, emoji)}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <Box
          ref={ref}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 2,
          }}
        >
          {isLoadingMore ? (
            <CircularProgress size={24} />
          ) : (
            <Button onClick={onLoadMore}>Mehr laden</Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatMessageList;