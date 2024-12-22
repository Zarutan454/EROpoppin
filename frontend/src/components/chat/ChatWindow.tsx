import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Badge,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Block as BlockIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useSocket } from '../../hooks/useSocket';
import { ChatMessage } from '../../types/chat';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const socket = useSocket({
    onMessage: handleNewMessage,
    onTyping: handleTypingStatus,
  });

  useEffect(() => {
    loadMessages();
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    try {
      const response = await fetch(`/api/chat/messages/${recipientId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  function handleNewMessage(message: ChatMessage) {
    if (message.senderId === recipientId || message.receiverId === recipientId) {
      setMessages(prev => [...prev, message]);
    }
  }

  function handleTypingStatus({ from, isTyping }: { from: string; isTyping: boolean }) {
    if (from === recipientId) {
      setIsTyping(isTyping);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function sendMessage(content: string, type: 'text' | 'image' | 'file' = 'text', file?: File) {
    try {
      let messageData: any = {
        receiverId: recipientId,
        content,
        type,
      };

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });
        
        const { url, metadata } = await uploadResponse.json();
        messageData.mediaUrl = url;
        messageData.metadata = metadata;
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function handleEmojiSelect(emojiData: EmojiClickData) {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        sendMessage(newMessage.trim());
      }
    }
  }

  function handleTyping() {
    socket.emit('typing:start', recipientId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', recipientId);
    }, 1000);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Image preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImagePreview(true);
      };
      reader.readAsDataURL(file);
    } else {
      // Direct upload for other file types
      await sendMessage(file.name, 'file', file);
    }
  }

  function handleMessageMenu(event: React.MouseEvent<HTMLElement>, message: ChatMessage) {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  }

  async function handleDeleteMessage() {
    if (!selectedMessage) return;

    try {
      await fetch(`/api/chat/messages/${selectedMessage.id}`, {
        method: 'DELETE',
      });

      setMessages(prev => 
        prev.filter(msg => msg.id !== selectedMessage.id)
      );
    } catch (error) {
      console.error('Error deleting message:', error);
    }

    setAnchorEl(null);
    setSelectedMessage(null);
  }

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '600px',
        width: '100%',
        maxWidth: '800px',
        margin: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color={isTyping ? 'success' : 'default'}
        >
          <Avatar src={recipientAvatar} alt={recipientName}>
            {recipientName[0]}
          </Avatar>
        </Badge>
        <Box sx={{ ml: 2, flex: 1 }}>
          <Typography variant="h6">{recipientName}</Typography>
          {isTyping && (
            <Typography variant="caption" color="text.secondary">
              schreibt...
            </Typography>
          )}
        </Box>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              alignSelf: message.senderId === recipientId ? 'flex-start' : 'flex-end',
              maxWidth: '70%',
            }}
          >
            <Paper
              sx={{
                p: 1,
                bgcolor: message.senderId === recipientId ? 'grey.100' : 'primary.light',
                color: message.senderId === recipientId ? 'text.primary' : 'white',
              }}
            >
              {message.type === 'image' && (
                <Box
                  component="img"
                  src={message.mediaUrl}
                  alt="Shared image"
                  sx={{
                    maxWidth: '100%',
                    borderRadius: 1,
                    cursor: 'pointer',
                    mb: message.content ? 1 : 0,
                  }}
                  onClick={() => {
                    setSelectedImage(message.mediaUrl!);
                    setShowImagePreview(true);
                  }}
                />
              )}
              {message.type === 'file' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: message.content ? 1 : 0,
                  }}
                >
                  <AttachFileIcon />
                  <Typography
                    component="a"
                    href={message.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {message.metadata?.fileName}
                  </Typography>
                </Box>
              )}
              <Typography>{message.content}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFileIcon />
          </IconButton>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx"
          />
          <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <EmojiIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Nachricht schreiben..."
          />
          <IconButton
            color="primary"
            disabled={!newMessage.trim()}
            onClick={() => newMessage.trim() && sendMessage(newMessage.trim())}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            zIndex: 1,
          }}
        >
          <EmojiPicker onEmojiClick={handleEmojiSelect} />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleDeleteMessage}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Nachricht löschen</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Chat archivieren</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Benutzer blockieren</ListItemText>
        </MenuItem>
      </Menu>

      {/* Image Preview Dialog */}
      <Dialog
        open={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        maxWidth="md"
        fullWidth
      >
        <Box
          component="img"
          src={selectedImage || ''}
          alt="Preview"
          sx={{
            width: '100%',
            height: 'auto',
          }}
        />
      </Dialog>
    </Paper>
  );
};

export default ChatWindow;