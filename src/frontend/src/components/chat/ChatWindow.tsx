import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, IconButton, Typography, Avatar, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useSocket } from '../../hooks/useSocket';
import { ChatMessage } from '../../types/chat';
import { formatDistance } from 'date-fns';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiPicker from 'emoji-picker-react';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  currentUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  currentUserId,
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const socket = useSocket({
    token: localStorage.getItem('token') || '',
    onMessage: (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    },
    onTyping: (data) => {
      if (data.from === recipientId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    },
  });

  useEffect(() => {
    loadChatHistory();
    scrollToBottom();
  }, [recipientId]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history/${recipientId}`);
      const history = await response.json();
      setMessages(history);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      content: message,
      from: currentUserId,
      to: recipientId,
      timestamp: Date.now(),
      type: 'text',
    };

    socket.emit('send_message', newMessage);
    setMessage('');
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const handleTyping = () => {
    socket.emit('typing', { roomId: `${currentUserId}:${recipientId}`, userId: currentUserId });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });
      const { url } = await response.json();

      const newMessage: ChatMessage = {
        content: url,
        from: currentUserId,
        to: recipientId,
        timestamp: Date.now(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        filename: file.name,
      };

      socket.emit('send_message', newMessage);
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleEmojiClick = (event: any, emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={recipientAvatar} alt={recipientName} />
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6">{recipientName}</Typography>
            {isTyping && (
              <Typography variant="caption" color="text.secondary">
                typing...
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.from === currentUserId ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                backgroundColor: msg.from === currentUserId ? 'primary.main' : 'grey.100',
                color: msg.from === currentUserId ? 'white' : 'text.primary',
                maxWidth: '70%',
              }}
            >
              {msg.type === 'text' && <Typography>{msg.content}</Typography>}
              {msg.type === 'image' && (
                <Box
                  component="img"
                  src={msg.content}
                  alt="Shared image"
                  sx={{ maxWidth: '100%', borderRadius: 1 }}
                />
              )}
              {msg.type === 'file' && (
                <Box
                  component="a"
                  href={msg.content}
                  download={msg.filename}
                  sx={{ color: 'inherit', textDecoration: 'none' }}
                >
                  📎 {msg.filename}
                </Box>
              )}
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                {formatDistance(msg.timestamp, new Date(), { addSuffix: true })}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ position: 'relative' }}>
          {showEmojiPicker && (
            <Box sx={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 1 }}>
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              size="small"
            >
              <AttachFileIcon />
            </IconButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <IconButton
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              size="small"
            >
              <EmojiEmotionsIcon />
            </IconButton>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSend();
                handleTyping();
              }}
              sx={{ mx: 1 }}
            />
            <IconButton
              onClick={handleSend}
              color="primary"
              disabled={!message.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
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