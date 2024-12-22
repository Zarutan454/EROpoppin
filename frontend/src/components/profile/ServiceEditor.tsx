import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Switch,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface Service {
  name: string;
  description?: string;
  duration: number;
  price: number;
  enabled: boolean;
}

interface ServiceEditorProps {
  services: {
    [key: string]: Service;
  };
  onChange: (services: { [key: string]: Service }) => void;
}

export function ServiceEditor({ services, onChange }: ServiceEditorProps) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  function handleAddService() {
    setEditingService({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      enabled: true,
    });
    setEditingServiceId(null);
  }

  function handleEditService(serviceId: string) {
    setEditingService({ ...services[serviceId] });
    setEditingServiceId(serviceId);
  }

  function handleDeleteService(serviceId: string) {
    const { [serviceId]: deleted, ...rest } = services;
    onChange(rest);
  }

  function handleToggleService(serviceId: string) {
    onChange({
      ...services,
      [serviceId]: {
        ...services[serviceId],
        enabled: !services[serviceId].enabled
      }
    });
  }

  function handleSaveService() {
    if (!editingService) return;

    const serviceId = editingServiceId || Math.random().toString(36).substr(2, 9);
    onChange({
      ...services,
      [serviceId]: editingService
    });

    handleCloseDialog();
  }

  function handleCloseDialog() {
    setEditingService(null);
    setEditingServiceId(null);
  }

  return (
    <Box>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddService}
        >
          Neue Dienstleistung
        </Button>
      </Box>

      <Grid container spacing={2}>
        {Object.entries(services).map(([serviceId, service]) => (
          <Grid item xs={12} sm={6} md={4} key={serviceId}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="h2">
                    {service.name}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={service.enabled}
                        onChange={() => handleToggleService(serviceId)}
                      />
                    }
                    label="Aktiv"
                  />
                </Box>

                {service.description && (
                  <Typography color="text.secondary" paragraph>
                    {service.description}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">
                    Dauer:
                  </Typography>
                  <Typography>
                    {service.duration} Minuten
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">
                    Preis:
                  </Typography>
                  <Typography>
                    {service.price.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditService(serviceId)}
                >
                  Bearbeiten
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteService(serviceId)}
                >
                  Löschen
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Service Editor Dialog */}
      <Dialog
        open={Boolean(editingService)}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingServiceId ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={editingService?.name || ''}
              onChange={(e) => setEditingService(prev => ({
                ...prev!,
                name: e.target.value
              }))}
            />

            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={3}
              value={editingService?.description || ''}
              onChange={(e) => setEditingService(prev => ({
                ...prev!,
                description: e.target.value
              }))}
            />

            <TextField
              label="Dauer (Minuten)"
              type="number"
              fullWidth
              value={editingService?.duration || ''}
              onChange={(e) => setEditingService(prev => ({
                ...prev!,
                duration: parseInt(e.target.value, 10)
              }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">min</InputAdornment>
                ),
              }}
            />

            <TextField
              label="Preis"
              type="number"
              fullWidth
              value={editingService?.price || ''}
              onChange={(e) => setEditingService(prev => ({
                ...prev!,
                price: parseFloat(e.target.value)
              }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editingService?.enabled ?? true}
                  onChange={(e) => setEditingService(prev => ({
                    ...prev!,
                    enabled: e.target.checked
                  }))}
                />
              }
              label="Aktiv"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            onClick={handleSaveService}
            variant="contained"
            disabled={!editingService?.name}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}