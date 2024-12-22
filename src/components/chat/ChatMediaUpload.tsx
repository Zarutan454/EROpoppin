import React, { useState, useCallback } from 'react';
import { Box, IconButton, CircularProgress, Typography } from '@mui/material';
import { AttachFile, Image, Close } from '@mui/icons-material';
import { compressImage } from '../../utils/imageCompression';

interface ChatMediaUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const ChatMediaUpload: React.FC<ChatMediaUploadProps> = ({ onUpload, isUploading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Nur Bilder sind erlaubt');
      }

      // Validate file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Maximale Dateigröße ist 5MB');
      }

      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      // Upload file
      await onUpload(compressedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    }
  }, [onUpload]);

  const clearPreview = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id="chat-media-upload"
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <label htmlFor="chat-media-upload">
        <IconButton component="span" disabled={isUploading}>
          <AttachFile />
        </IconButton>
      </label>

      {isUploading && (
        <CircularProgress
          size={24}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginTop: '-12px',
            marginLeft: '-12px'
          }}
        />
      )}

      {preview && (
        <Box sx={{ position: 'relative', mt: 1 }}>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} 
          />
          <IconButton
            size="small"
            onClick={clearPreview}
            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)' }}
          >
            <Close sx={{ color: 'white' }} />
          </IconButton>
        </Box>
      )}

      {error && (
        <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};