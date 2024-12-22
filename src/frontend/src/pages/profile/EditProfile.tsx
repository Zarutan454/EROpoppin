import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import BasicInfoForm from '@/components/profile/BasicInfoForm';
import GalleryManager from '@/components/profile/GalleryManager';
import ServicesForm from '@/components/profile/ServicesForm';
import AvailabilityCalendar from '@/components/profile/AvailabilityCalendar';
import LocationsForm from '@/components/profile/LocationsForm';
import RatesForm from '@/components/profile/RatesForm';
import VerificationForm from '@/components/profile/VerificationForm';
import LoadingScreen from '@/components/common/LoadingScreen';
import { EscortProfile } from '@/types/profile';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const EditProfile = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { profile, updateProfile, isLoading, error } = useProfile();

  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = async (sectionData: Partial<EscortProfile>) => {
    try {
      setIsSaving(true);
      await updateProfile(user!.id, sectionData);
      enqueueSnackbar(t('profile.saveSuccess'), { variant: 'success' });
    } catch (error) {
      console.error('Save error:', error);
      enqueueSnackbar(t('profile.saveError'), { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ mt: 3, p: { xs: 2, md: 3 } }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              mb: 4,
            }}
          >
            {t('profile.editTitle')}
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons={isMobile ? 'auto' : false}
              allowScrollButtonsMobile
              sx={{ mb: 2 }}
            >
              <Tab label={t('profile.tabs.basic')} />
              <Tab label={t('profile.tabs.gallery')} />
              <Tab label={t('profile.tabs.services')} />
              <Tab label={t('profile.tabs.availability')} />
              <Tab label={t('profile.tabs.locations')} />
              <Tab label={t('profile.tabs.rates')} />
              <Tab label={t('profile.tabs.verification')} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <BasicInfoForm
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <GalleryManager
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <ServicesForm
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <AvailabilityCalendar
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <LocationsForm
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={5}>
            <RatesForm
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={6}>
            <VerificationForm
              profile={profile}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </TabPanel>
        </Paper>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            sx={{ mr: 2 }}
            onClick={() => window.history.back()}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={isSaving}
            onClick={() => handleSave(profile)}
          >
            {isSaving ? (
              <CircularProgress size={24} sx={{ mr: 1 }} />
            ) : null}
            {t('common.save')}
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
};

export default EditProfile;