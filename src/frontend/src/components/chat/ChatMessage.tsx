import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Paper,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  EmojiEmotions as EmojiIcon,
  Reply as ReplyIcon,
  CheckCircle as DeliveredIcon,
  DoneAll as ReadIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import data from '@emoji-mart/data/sets/14/apple.json';
import Picker from '@emoji-mart/react';

import { ChatMessage as ChatMessageType } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwn: boolean;
  showAvatar: boolean;
  onDelete: () => Promise<void>;
  onReaction: (emoji: string) => Promise<void>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  showAvatar,
  onDelete,
  onReaction,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [emojiPickerAnchorEl, setEmojiPickerAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEmojiPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setEmojiPickerAnchorEl(event.currentTarget);
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerAnchorEl(null);
  };

  const handleEmojiSelect = async (emoji: any) => {
    await onReaction(emoji.native);
    handleEmojiPickerClose();
  };

  const handleDelete = async () => {
    await onDelete();
    handleMenuClose();
  };

  const renderStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <PendingIcon fontSize="small" />;
      case 'delivered':
        return <DeliveredIcon fontSize="small" color="primary" />;
      case 'read':
        return <ReadIcon fontSize="small" color="primary" />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        mb: 2,
        gap: 1,
      }}
    >
      {showAvatar && !isOwn && (
        <Avatar
          alt="User Avatar"
          src={message.senderId}
          sx={{ width: 32, height: 32 }}
        />
      )}

      {!showAvatar && !isOwn && <Box sx={{ width: 32 }} />}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        style={{ maxWidth: '70%' }}
      >
        <Paper
          sx={{
            p: 1.5,
            backgroundColor: isOwn
              ? 'primary.main'
              : 'background.paper',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            position: 'relative',
          }}
        >
          {message.replyTo && (
            <Box
              sx={{
                borderLeft: `2px solid ${theme.palette.divider}`,
                pl: 1,
                mb: 1,
                opacity: 0.7,
              }}
            >
              <Typography variant="caption">
                {message.replyTo.content}
              </Typography>
            </Box>
          )}

          {message.contentType === 'text' && (
            <Typography>{message.content}</Typography>
          )}

          {message.contentType === 'emoji' && (
            <Typography fontSize={24}>{message.content}</Typography>
          )}

          {message.contentType === 'image' && message.media && (
            <Box
              component="img"
              src={message.media.url}
              alt="Chat image"
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                borderRadius: 1,
                cursor: 'pointer',
              }}
              onClick={() => window.open(message.media!.url, '_blank')}
            />
          )}

          {message.reactions && message.reactions.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mt: 1,
              }}
            >
              {message.reactions.map((reaction, index) => (
                <Tooltip
                  key={index}
                  title={`Von ${reaction.userId}`}
                >
                  <Typography fontSize={16}>
                    {reaction.emoji}
                  </Typography>
                </Tooltip>
              ))}
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
              opacity: 0.7,
            }}
          >
            <Typography variant="caption">
              {format(new Date(message.createdAt), 'HH:mm')}
            </Typography>
            {isOwn && renderStatusIcon()}
          </Box>
        </Paper>
      </motion.div>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{ opacity: 0.7 }}
        >
          <MoreIcon fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEmojiPickerOpen}>
            <EmojiIcon sx={{ mr: 1 }} /> Reaktion
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ReplyIcon sx={{ mr: 1 }} /> Antworten
          </MenuItem>
          {isOwn && (
            <MenuItem onClick={handleDelete}>
              <DeleteIcon sx={{ mr: 1 }} /> Löschen
            </MenuItem>
          )}
        </Menu>

        <Menu
          anchorEl={emojiPickerAnchorEl}
          open={Boolean(emojiPickerAnchorEl)}
          onClose={handleEmojiPickerClose}
        >
          <Box sx={{ p: 1 }}>
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme={theme.palette.mode}
              set="apple"
            />
          </Box>
        </Menu>
      </Box>
    </Box>
  );
};

export default ChatMessage;