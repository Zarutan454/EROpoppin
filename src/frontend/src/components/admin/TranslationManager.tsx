import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface Translation {
  key: string;
  translations: Record<string, string>;
  namespace: string;
  lastUpdated: Date;
}

interface ValidationResult {
  missingTranslations: Record<string, string[]>;
  suggestions: Record<string, string[]>;
}

const supportedLanguages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

export const TranslationManager: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('common');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    translation?: Translation;
  }>({ open: false });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadTranslations();
  }, [selectedNamespace]);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/translations?namespace=${selectedNamespace}`);
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      enqueueSnackbar('Failed to load translations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateTranslations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/translations/validate');
      const data = await response.json();
      setValidation(data);
    } catch (error) {
      enqueueSnackbar('Validation failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (translation: Translation) => {
    try {
      const response = await fetch('/api/translations', {
        method: translation.key ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(translation),
      });

      if (!response.ok) throw new Error('Failed to save translation');

      enqueueSnackbar('Translation saved successfully', { variant: 'success' });
      loadTranslations();
      setEditDialog({ open: false });
    } catch (error) {
      enqueueSnackbar('Failed to save translation', { variant: 'error' });
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm('Are you sure you want to delete this translation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/translations/${key}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete translation');

      enqueueSnackbar('Translation deleted successfully', { variant: 'success' });
      loadTranslations();
    } catch (error) {
      enqueueSnackbar('Failed to delete translation', { variant: 'error' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/translations/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Import failed');

      enqueueSnackbar('Translations imported successfully', { variant: 'success' });
      loadTranslations();
    } catch (error) {
      enqueueSnackbar('Failed to import translations', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/translations/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${selectedNamespace}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      enqueueSnackbar('Failed to export translations', { variant: 'error' });
    }
  };

  const filteredTranslations = translations.filter(t =>
    t.key.toLowerCase().includes(filter.toLowerCase()) ||
    Object.values(t.translations).some(v =>
      v.toLowerCase().includes(filter.toLowerCase())
    )
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Translation Manager
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                  label="Filter translations"
                  variant="outlined"
                  size="small"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEditDialog({ open: true })}
                >
                  Add Translation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={validateTranslations}
                >
                  Validate
                </Button>
                <input
                  accept=".json"
                  id="import-file"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
                <label htmlFor="import-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    Import
                  </Button>
                </label>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadIcon />}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Box>

              {validation && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Found {Object.keys(validation.missingTranslations).length} keys with missing translations
                </Alert>
              )}

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      {supportedLanguages.map(lang => (
                        <TableCell key={lang.code}>
                          {lang.flag} {lang.name}
                        </TableCell>
                      ))}
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTranslations.map(translation => (
                        <TableRow key={translation.key}>
                          <TableCell>{translation.key}</TableCell>
                          {supportedLanguages.map(lang => (
                            <TableCell key={lang.code}>
                              {translation.translations[lang.code] || (
                                <Typography color="error" variant="body2">
                                  Missing
                                </Typography>
                              )}
                            </TableCell>
                          ))}
                          <TableCell>
                            <IconButton
                              onClick={() => setEditDialog({
                                open: true,
                                translation,
                              })}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(translation.key)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialog.translation ? 'Edit Translation' : 'Add Translation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Key"
              value={editDialog.translation?.key || ''}
              onChange={(e) =>
                setEditDialog(prev => ({
                  ...prev,
                  translation: {
                    ...prev.translation!,
                    key: e.target.value,
                  },
                }))
              }
              disabled={!!editDialog.translation}
              sx={{ mb: 3 }}
            />
            {supportedLanguages.map(lang => (
              <TextField
                key={lang.code}
                fullWidth
                label={`${lang.flag} ${lang.name}`}
                value={editDialog.translation?.translations[lang.code] || ''}
                onChange={(e) =>
                  setEditDialog(prev => ({
                    ...prev,
                    translation: {
                      ...prev.translation!,
                      translations: {
                        ...prev.translation!.translations,
                        [lang.code]: e.target.value,
                      },
                    },
                  }))
                }
                sx={{ mb: 2 }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false })}>Cancel</Button>
          <Button
            onClick={() => handleSave(editDialog.translation!)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};