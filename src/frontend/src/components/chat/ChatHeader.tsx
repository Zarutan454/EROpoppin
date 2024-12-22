import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { Chat } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ChatHeaderProps {
  chat: Chat | undefined;
  isTyping: boolean;
  onBack?: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  isTyping,
  onBack,
  onMenuClick,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Partner-ID aus Chat-Teilnehmern ermitteln
  const partnerId = chat?.participants.find((id) => id !== user?.id);
  const { profile: partnerProfile } = useProfile(partnerId);

  if (!chat || !partnerProfile) return null;

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {onBack && (
        <IconButton onClick={onBack} edge="start">
          <BackIcon />
        </IconButton>
      )}

      <Avatar
        src={partnerProfile.avatar}
        alt={partnerProfile.name}
        sx={{
          width: 40,
          height: 40,
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      />

      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">
          {partnerProfile.name}
        </Typography>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isTyping ? 1 : 0,
            height: isTyping ? 'auto' : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <Typography
            variant="caption"
            color="primary"
            sx={{ fontStyle: 'italic' }}
          >
            Schreibt...
          </Typography>
        </motion.div>
      </Box>

      <IconButton onClick={onMenuClick}>
        <MoreIcon />
      </IconButton>
    </Box>
  );
};

export default ChatHeader;