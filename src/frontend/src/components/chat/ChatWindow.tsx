import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
  useTheme,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  EmojiEmotions as EmojiIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import data from '@emoji-mart/data/sets/14/apple.json';
import Picker from '@emoji-mart/react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage, ChatMessageRequest } from '@/types/chat';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

import ChatMessageInput from './ChatMessageInput';
import ChatMessageList from './ChatMessageList';
import ChatMediaPreview from './ChatMediaPreview';
import ChatHeader from './ChatHeader';

interface ChatWindowProps {
  chatId: string;
  onClose?: () => void;
  isMobile?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  onClose,
  isMobile = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    chat,
    messages,
    isTyping,
    uploadProgress,
    isChatLoading,
    isMessagesLoading,
    sendMessage,
    deleteMessage,
    clearHistory,
    addReaction,
    sendTypingStatus,
    markAsRead,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChat(chatId);

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Scroll zum letzten Message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Nachrichten als gelesen markieren
  useEffect(() => {
    if (messages?.pages) {
      const unreadMessages = messages.pages
        .flatMap((page) => page.messages)
        .filter((msg) => msg.status !== 'read')
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [messages, markAsRead]);

  const handleSend = async () => {
    if (!messageText.trim() && !selectedFile) return;

    const messageData: ChatMessageRequest = {
      chatId,
      receiverId: chat!.participants.find((id) => id !== user?.id)!,
      content: messageText.trim(),
      contentType: selectedFile ? 'image' : 'text',
      media: selectedFile,
    };

    try {
      await sendMessage(messageData);
      setMessageText('');
      setSelectedFile(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        enqueueSnackbar(t('chat.onlyImages'), { variant: 'error' });
      }
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessageText((prev) => prev + emoji.native);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleClearHistory = async () => {
    if (window.confirm(t('chat.confirmClear'))) {
      await clearHistory();
      handleMenuClose();
    }
  };

  if (isChatLoading) {
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

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <ChatHeader
        chat={chat}
        isTyping={isTyping}
        onBack={isMobile ? onClose : undefined}
        onMenuClick={handleMenuOpen}
      />

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleClearHistory}>
          <DeleteIcon sx={{ mr: 1 }} />
          {t('chat.clearHistory')}
        </MenuItem>
      </Menu>

      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChatMessageList
          messages={messages}
          isLoading={isMessagesLoading}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onDeleteMessage={deleteMessage}
          onAddReaction={addReaction}
        />
        <div ref={messageEndRef} />
      </Box>

      {selectedFile && (
        <ChatMediaPreview
          file={selectedFile}
          onRemove={() => setSelectedFile(null)}
          uploadProgress={uploadProgress}
        />
      )}

      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <ChatMessageInput
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            sendTypingStatus(true);
          }}
          onKeyPress={handleKeyPress}
          onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
          onSend={handleSend}
          onAttach={() => fileInputRef.current?.click()}
          disabled={false}
        />

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                bottom: '100%',
                right: theme.spacing(2),
                zIndex: 1000,
              }}
            >
              <Paper elevation={4}>
                <Box sx={{ p: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setShowEmojiPicker(false)}
                    sx={{ float: 'right' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme={theme.palette.mode}
                  set="apple"
                />
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileSelect}
        />
      </Box>
    </Paper>
  );
};

export default ChatWindow;