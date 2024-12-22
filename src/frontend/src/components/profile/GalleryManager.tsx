import { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Card,
  CardMedia,
  CardActions,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CloudUpload as CloudUploadIcon,
  Verified as VerifiedIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

import { EscortProfile, ProfileImage } from '@/types/profile';
import { useProfile } from '@/hooks/useProfile';
import ImageCropper from '@/components/common/ImageCropper';

interface GalleryManagerProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const GalleryManager = ({ profile, onSave, isSaving }: GalleryManagerProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    uploadImage,
    deleteImage,
    setMainImage,
    isUploading,
    isDeleting,
  } = useProfile();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      setShowCropper(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  const handleCropComplete = async (croppedImage: Blob) => {
    setShowCropper(false);
    if (profile.id && croppedImage) {
      try {
        const file = new File([croppedImage], 'profile-image.jpg', {
          type: 'image/jpeg',
        });
        await uploadImage(profile.id, file);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (profile.id) {
      try {
        await deleteImage(profile.id, imageId);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    if (profile.id) {
      try {
        await setMainImage(profile.id, imageId);
      } catch (error) {
        console.error('Set main image error:', error);
      }
    }
  };

  const handlePreviewImage = (url: string) => {
    setPreviewUrl(url);
    setShowPreview(true);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('profile.gallery')}
      </Typography>

      {/* Upload-Bereich */}
      <Box
        {...getRootProps()}
        sx={{
          p: 3,
          mb: 3,
          border: `2px dashed ${
            isDragActive ? theme.palette.primary.main : theme.palette.divider
          }`,
          borderRadius: 1,
          backgroundColor: isDragActive
            ? alpha(theme.palette.primary.main, 0.1)
            : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: isDragActive
                ? 'primary.main'
                : 'text.secondary',
            }}
          />
          <Typography
            variant="body1"
            color={isDragActive ? 'primary.main' : 'text.secondary'}
            align="center"
          >
            {isDragActive
              ? t('profile.dropToUpload')
              : t('profile.dragOrClick')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('profile.imageRequirements')}
          </Typography>
        </Box>
      </Box>

      {/* Bildergalerie */}
      <Grid container spacing={2}>
        <AnimatePresence>
          {profile.images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={image.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={image.url}
                      alt={t('profile.imageAlt', { index: index + 1 })}
                      sx={{
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
                      onClick={() => handlePreviewImage(image.url)}
                    />
                    {image.isMain && (
                      <Badge
                        color="primary"
                        badgeContent={t('profile.mainImage')}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                        }}
                      />
                    )}
                    {image.isVerified && (
                      <Tooltip title={t('profile.verifiedImage')}>
                        <VerifiedIcon
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handlePreviewImage(image.url)}
                    >
                      <PreviewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleSetMainImage(image.id)}
                      disabled={image.isMain}
                    >
                      {image.isMain ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={isDeleting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {/* Bild-Cropper Dialog */}
      <Dialog
        open={showCropper}
        onClose={() => setShowCropper(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('profile.cropImage')}</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <ImageCropper
              image={URL.createObjectURL(selectedImage)}
              onCropComplete={handleCropComplete}
              aspectRatio={3 / 4}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bild-Vorschau Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <img
            src={previewUrl}
            alt={t('profile.preview')}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GalleryManager;