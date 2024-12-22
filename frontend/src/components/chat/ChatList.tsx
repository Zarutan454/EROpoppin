import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  NotificationsOff as MuteIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ChatPreview {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  lastMessage?: {
    content: string;
    type: 'text' | 'image' | 'file';
    timestamp: string;
  };
  unreadCount: number;
  online: boolean;
}

interface ChatListProps {
  onChatSelect: (recipientId: string) => void;
  selectedChat?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChat }) => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedChatMenu, setSelectedChatMenu] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    filterChats();
  }, [searchQuery, chats]);

  async function loadChats() {
    try {
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();
      setChats(data);
      setFilteredChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  function filterChats() {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = chats.filter(chat =>
      chat.recipientName.toLowerCase().includes(query) ||
      chat.lastMessage?.content.toLowerCase().includes(query)
    );
    setFilteredChats(filtered);
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(event.target.value);
  }

  function handleMenuClick(event: React.MouseEvent<HTMLElement>, chatId: string) {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedChatMenu(chatId);
  }

  function handleMenuClose() {
    setAnchorEl(null);
    setSelectedChatMenu(null);
  }

  async function handleArchiveChat() {
    if (!selectedChatMenu) return;

    try {
      await fetch(`/api/chat/conversations/${selectedChatMenu}/archive`, {
        method: 'POST',
      });
      
      setChats(prevChats =>
        prevChats.filter(chat => chat.id !== selectedChatMenu)
      );
    } catch (error) {
      console.error('Error archiving chat:', error);
    }

    handleMenuClose();
  }

  async function handleDeleteChat() {
    if (!selectedChatMenu) return;

    try {
      await fetch(`/api/chat/conversations/${selectedChatMenu}`, {
        method: 'DELETE',
      });
      
      setChats(prevChats =>
        prevChats.filter(chat => chat.id !== selectedChatMenu)
      );
    } catch (error) {
      console.error('Error deleting chat:', error);
    }

    handleMenuClose();
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Chats durchsuchen..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Divider />

      {/* Chat List */}
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {filteredChats.map((chat) => (
          <ListItem
            key={chat.id}
            alignItems="flex-start"
            button
            selected={chat.recipientId === selectedChat}
            onClick={() => onChatSelect(chat.recipientId)}
            secondaryAction={
              <IconButton
                edge="end"
                onClick={(e) => handleMenuClick(e, chat.id)}
              >
                <MoreIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                color={chat.online ? 'success' : 'default'}
              >
                <Avatar
                  alt={chat.recipientName}
                  src={chat.recipientAvatar}
                >
                  {chat.recipientName[0]}
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography
                  component="span"
                  variant="body1"
                  color="text.primary"
                >
                  {chat.recipientName}
                </Typography>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {chat.lastMessage?.type === 'image' && '📷 Bild'}
                    {chat.lastMessage?.type === 'file' && '📎 Datei'}
                    {chat.lastMessage?.type === 'text' && chat.lastMessage.content}
                  </Typography>
                  {' • '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {chat.lastMessage?.timestamp &&
                      formatDistanceToNow(new Date(chat.lastMessage.timestamp), {
                        addSuffix: true,
                        locale: de,
                      })}
                  </Typography>
                </React.Fragment>
              }
            />
            {chat.unreadCount > 0 && (
              <Badge
                badgeContent={chat.unreadCount}
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </ListItem>
        ))}
      </List>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleArchiveChat}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archivieren</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <MuteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Stummschalten</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteChat}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Chat löschen</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Benutzer blockieren</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatList;