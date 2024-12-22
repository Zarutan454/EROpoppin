import React from 'react';
import {
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { ChatMediaUploadProgress } from '@/types/chat';

interface ChatMediaPreviewProps {
  file: File;
  onRemove: () => void;
  uploadProgress: ChatMediaUploadProgress | null;
}

const ChatMediaPreview: React.FC<ChatMediaPreviewProps> = ({
  file,
  onRemove,
  uploadProgress,
}) => {
  const theme = useTheme();
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    return () => setPreview(null);
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Paper
        sx={{
          p: 1,
          m: 2,
          position: 'relative',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {preview ? (
            <Box
              component="img"
              src={preview}
              alt="Upload preview"
              sx={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1,
              }}
            />
          ) : (
            <Box
              sx={{
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <ImageIcon />
            </Box>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" noWrap>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>

            {uploadProgress && (
              <Box sx={{ width: '100%', mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress.progress}
                  color={
                    uploadProgress.status === 'error'
                      ? 'error'
                      : 'primary'
                  }
                />
                {uploadProgress.status === 'error' && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5 }}
                  >
                    {uploadProgress.error}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={onRemove}
            disabled={uploadProgress?.status === 'uploading'}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ChatMediaPreview;