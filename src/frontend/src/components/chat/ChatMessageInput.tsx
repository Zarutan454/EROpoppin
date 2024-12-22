import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachIcon,
} from '@mui/icons-material';

interface ChatMessageInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  onEmojiClick: () => void;
  onSend: () => void;
  onAttach: () => void;
  disabled?: boolean;
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  value,
  onChange,
  onKeyPress,
  onEmojiClick,
  onSend,
  onAttach,
  disabled = false,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
      <IconButton
        color="primary"
        onClick={onEmojiClick}
        disabled={disabled}
      >
        <EmojiIcon />
      </IconButton>

      <IconButton
        color="primary"
        onClick={onAttach}
        disabled={disabled}
      >
        <AttachIcon />
      </IconButton>

      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        disabled={disabled}
        placeholder="Nachricht eingeben..."
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                color="primary"
                onClick={onSend}
                disabled={disabled || !value.trim()}
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default ChatMessageInput;