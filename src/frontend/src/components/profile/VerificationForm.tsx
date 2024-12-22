import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  TextField,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  MenuItem,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

import { EscortProfile } from '@/types/profile';
import { verificationDocuments } from '@/utils/options';
import { formatFileSize } from '@/utils/format';

interface VerificationFormProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const VerificationForm = ({
  profile,
  onSave,
  isSaving,
}: VerificationFormProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setSelectedFile(file);
      setError(null);
    } else {
      setError(t('validation.fileTooLarge'));
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!selectedFile || !selectedDocumentType) {
      setError(t('validation.requiredFields'));
      return;
    }

    try {
      // Simuliere Upload-Progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Hier würde normalerweise der tatsächliche Upload stattfinden
      await onSave({
        verificationStatus: 'pending',
      });

      clearInterval(interval);
      setUploadProgress(100);
      setSelectedFile(null);
      setSelectedDocumentType('');
    } catch (error) {
      setError(t('error.uploadFailed'));
      setUploadProgress(0);
    }
  };

  const renderVerificationStatus = () => {
    switch (profile.verificationStatus) {
      case 'verified':
        return (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3 }}
          >
            <AlertTitle>{t('profile.verificationVerified')}</AlertTitle>
            {t('profile.verificationVerifiedText')}
          </Alert>
        );
      case 'pending':
        return (
          <Alert
            severity="info"
            icon={<WarningIcon />}
            sx={{ mb: 3 }}
          >
            <AlertTitle>{t('profile.verificationPending')}</AlertTitle>
            {t('profile.verificationPendingText')}
          </Alert>
        );
      case 'rejected':
        return (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ mb: 3 }}
          >
            <AlertTitle>{t('profile.verificationRejected')}</AlertTitle>
            {t('profile.verificationRejectedText')}
          </Alert>
        );
      default:
        return (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 3 }}
          >
            <AlertTitle>{t('profile.verificationRequired')}</AlertTitle>
            {t('profile.verificationRequiredText')}
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('profile.verification')}
      </Typography>

      {renderVerificationStatus()}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Verifizierungsanforderungen */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              {t('profile.verificationRequirements')}
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('profile.verificationReq1')}
                  secondary={t('profile.verificationReq1Text')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('profile.verificationReq2')}
                  secondary={t('profile.verificationReq2Text')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={t('profile.verificationReq3')}
                  secondary={t('profile.verificationReq3Text')}
                />
              </ListItem>
            </List>
          </Grid>

          {/* Dokumenttyp-Auswahl */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label={t('profile.documentType')}
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
            >
              {verificationDocuments.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.label)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Datei-Upload */}
          <Grid item xs={12}>
            <Box
              {...getRootProps()}
              sx={{
                p: 3,
                border: `2px dashed ${
                  isDragActive ? theme.palette.primary.main : theme.palette.divider
                }`,
                borderRadius: 1,
                backgroundColor: isDragActive
                  ? theme.palette.action.hover
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                textAlign: 'center',
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon
                sx={{
                  fontSize: 48,
                  color: isDragActive
                    ? 'primary.main'
                    : 'text.secondary',
                  mb: 2,
                }}
              />
              <Typography color="textSecondary">
                {isDragActive
                  ? t('profile.dropToUpload')
                  : t('profile.dragOrClick')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {t('profile.supportedFormats')}
              </Typography>
            </Box>
          </Grid>

          {/* Ausgewählte Datei */}
          {selectedFile && (
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center' }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Box>
                <Chip
                  label={t('common.remove')}
                  onDelete={() => setSelectedFile(null)}
                  variant="outlined"
                />
              </Paper>
            </Grid>
          )}

          {/* Fehleranzeige */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {/* Upload-Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Grid item xs={12}>
              <Box sx={{ position: 'relative', pt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                  }}
                >
                  {uploadProgress}%
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  !selectedFile ||
                  !selectedDocumentType ||
                  isSaving ||
                  uploadProgress > 0
                }
                startIcon={
                  isSaving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <UploadIcon />
                  )
                }
              >
                {t('profile.submitVerification')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Datenschutzhinweis */}
      <Alert severity="info">
        <AlertTitle>{t('profile.privacyNote')}</AlertTitle>
        {t('profile.privacyNoteText')}
      </Alert>
    </Box>
  );
};

export default VerificationForm;