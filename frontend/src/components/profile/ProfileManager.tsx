import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ImageCropper from '../common/ImageCropper';
import { WeeklyScheduler } from './WeeklyScheduler';
import { ServiceEditor } from './ServiceEditor';
import { StatisticsPanel } from './StatisticsPanel';
import { useSnackbar } from 'notistack';

interface ProfileData {
  id: string;
  displayName: string;
  bio: string;
  location: {
    city: string;
    country: string;
  };
  images: {
    id: string;
    url: string;
    type: 'profile' | 'gallery';
    isPrivate: boolean;
    order: number;
  }[];
  availability: {
    schedule: {
      [key: string]: {
        enabled: boolean;
        slots: {
          start: string;
          end: string;
        }[];
      };
    };
    specialDates: {
      date: string;
      available: boolean;
      slots?: {
        start: string;
        end: string;
      }[];
    }[];
    vacation: {
      start: string;
      end: string;
    }[];
  };
  services: {
    [key: string]: {
      name: string;
      description?: string;
      duration: number;
      price: number;
      enabled: boolean;
    };
  };
  stats: {
    views: number;
    bookings: number;
    rating: number;
    ratingCount: number;
    responseRate: number;
    responseTime: number;
  };
  preferences: {
    contactMethods: {
      email: boolean;
      phone: boolean;
      whatsapp: boolean;
    };
    notifications: {
      bookings: boolean;
      messages: boolean;
      reviews: boolean;
      promotions: boolean;
    };
    privacy: {
      showOnlineStatus: boolean;
      showLastSeen: boolean;
      showProfileViews: boolean;
    };
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfileManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      enqueueSnackbar('Failed to load profile', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!profile) return;

    setSaving(true);
    try {
      await fetch(`/api/profile/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      enqueueSnackbar('Profile saved successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to save profile', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    setSelectedImage(file);
    setImageUploadOpen(true);
  }

  async function handleImageCropComplete(croppedBlob: Blob) {
    setCroppedImage(croppedBlob);
  }

  async function handleImageUploadConfirm() {
    if (!croppedImage || !profile) return;

    const formData = new FormData();
    formData.append('image', croppedImage);

    try {
      const response = await fetch(`/api/profile/${profile.id}/images`, {
        method: 'POST',
        body: formData
      });
      const { url } = await response.json();

      setProfile(prev => ({
        ...prev!,
        images: [
          ...prev!.images,
          {
            id: Math.random().toString(),
            url,
            type: 'gallery',
            isPrivate: false,
            order: prev!.images.length
          }
        ]
      }));

      enqueueSnackbar('Image uploaded successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to upload image', { variant: 'error' });
    } finally {
      setImageUploadOpen(false);
      setSelectedImage(null);
      setCroppedImage(null);
    }
  }

  async function handleImageDelete(imageId: string) {
    if (!profile) return;

    try {
      await fetch(`/api/profile/${profile.id}/images/${imageId}`, {
        method: 'DELETE'
      });

      setProfile(prev => ({
        ...prev!,
        images: prev!.images.filter(img => img.id !== imageId)
      }));

      enqueueSnackbar('Image deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete image', { variant: 'error' });
    }
  }

  async function handleImageReorder(result: any) {
    if (!result.destination || !profile) return;

    const items = Array.from(profile.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedImages = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setProfile(prev => ({
      ...prev!,
      images: updatedImages
    }));

    try {
      await fetch(`/api/profile/${profile.id}/images/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedImages.map(img => ({
          imageId: img.id,
          order: img.order
        })))
      });
    } catch (error) {
      enqueueSnackbar('Failed to reorder images', { variant: 'error' });
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Alert severity="error">Failed to load profile</Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Basic Info" />
              <Tab label="Images" />
              <Tab label="Availability" />
              <Tab label="Services" />
              <Tab label="Statistics" />
              <Tab label="Preferences" />
            </Tabs>
          </Box>

          {/* Basic Info */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={profile.displayName}
                  onChange={e => setProfile(prev => ({
                    ...prev!,
                    displayName: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Bio"
                  value={profile.bio}
                  onChange={e => setProfile(prev => ({
                    ...prev!,
                    bio: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={profile.location.city}
                  onChange={e => setProfile(prev => ({
                    ...prev!,
                    location: {
                      ...prev!.location,
                      city: e.target.value
                    }
                  }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={profile.location.country}
                  onChange={e => setProfile(prev => ({
                    ...prev!,
                    location: {
                      ...prev!.location,
                      country: e.target.value
                    }
                  }))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Images */}
          <TabPanel value={activeTab} index={1}>
            <Box mb={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component="label"
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                />
              </Button>
            </Box>

            <DragDropContext onDragEnd={handleImageReorder}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <Grid
                    container
                    spacing={2}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {profile.images
                      .sort((a, b) => a.order - b.order)
                      .map((image, index) => (
                        <Draggable key={image.id} draggableId={image.id} index={index}>
                          {(provided) => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              md={4}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card>
                                <Box
                                  component="img"
                                  src={image.url}
                                  sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover'
                                  }}
                                />
                                <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={image.isPrivate}
                                        onChange={e => {
                                          const updatedImages = [...profile.images];
                                          updatedImages[index].isPrivate = e.target.checked;
                                          setProfile(prev => ({
                                            ...prev!,
                                            images: updatedImages
                                          }));
                                        }}
                                      />
                                    }
                                    label="Private"
                                  />
                                  <IconButton
                                    color="error"
                                    onClick={() => handleImageDelete(image.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Card>
                            </Grid>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </Grid>
                )}
              </Droppable>
            </DragDropContext>
          </TabPanel>

          {/* Availability */}
          <TabPanel value={activeTab} index={2}>
            <WeeklyScheduler
              schedule={profile.availability.schedule}
              onChange={schedule => setProfile(prev => ({
                ...prev!,
                availability: {
                  ...prev!.availability,
                  schedule
                }
              }))}
            />
          </TabPanel>

          {/* Services */}
          <TabPanel value={activeTab} index={3}>
            <ServiceEditor
              services={profile.services}
              onChange={services => setProfile(prev => ({
                ...prev!,
                services
              }))}
            />
          </TabPanel>

          {/* Statistics */}
          <TabPanel value={activeTab} index={4}>
            <StatisticsPanel stats={profile.stats} />
          </TabPanel>

          {/* Preferences */}
          <TabPanel value={activeTab} index={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Contact Methods</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.contactMethods.email}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          contactMethods: {
                            ...prev!.preferences.contactMethods,
                            email: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.contactMethods.phone}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          contactMethods: {
                            ...prev!.preferences.contactMethods,
                            phone: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Phone"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.contactMethods.whatsapp}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          contactMethods: {
                            ...prev!.preferences.contactMethods,
                            whatsapp: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="WhatsApp"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Notifications</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications.bookings}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          notifications: {
                            ...prev!.preferences.notifications,
                            bookings: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Bookings"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications.messages}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          notifications: {
                            ...prev!.preferences.notifications,
                            messages: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Messages"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications.reviews}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          notifications: {
                            ...prev!.preferences.notifications,
                            reviews: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Reviews"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Privacy</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.privacy.showOnlineStatus}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          privacy: {
                            ...prev!.preferences.privacy,
                            showOnlineStatus: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Show Online Status"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.privacy.showLastSeen}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          privacy: {
                            ...prev!.preferences.privacy,
                            showLastSeen: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Show Last Seen"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.privacy.showProfileViews}
                      onChange={e => setProfile(prev => ({
                        ...prev!,
                        preferences: {
                          ...prev!.preferences,
                          privacy: {
                            ...prev!.preferences.privacy,
                            showProfileViews: e.target.checked
                          }
                        }
                      }))}
                    />
                  }
                  label="Show Profile Views"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Card>

      {/* Image Upload Dialog */}
      <Dialog open={imageUploadOpen} onClose={() => setImageUploadOpen(false)}>
        <DialogTitle>Crop Image</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <ImageCropper
              image={URL.createObjectURL(selectedImage)}
              onCropComplete={handleImageCropComplete}
              aspectRatio={16/9}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageUploadOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImageUploadConfirm}
            variant="contained"
            disabled={!croppedImage}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}