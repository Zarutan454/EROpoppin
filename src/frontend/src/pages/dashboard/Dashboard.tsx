import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Message as MessageIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useMessages } from '@/hooks/useMessages';
import { useStatistics } from '@/hooks/useStatistics';
import DashboardChart from '@/components/dashboard/DashboardChart';
import BookingList from '@/components/dashboard/BookingList';
import MessageList from '@/components/dashboard/MessageList';
import StatCard from '@/components/dashboard/StatCard';
import { formatCurrency } from '@/utils/format';

const Dashboard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, isLoading: isLoadingBookings } = useBookings();
  const { messages, isLoading: isLoadingMessages } = useMessages();
  const { statistics, isLoading: isLoadingStats } = useStatistics();

  // Animation Varianten
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <Container maxWidth={false}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Begrüßung und Übersicht */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <Typography variant="h4" gutterBottom>
                  {t('dashboard.welcome', { name: user?.name })}
                </Typography>
                <Typography color="text.secondary">
                  {format(new Date(), 'PPPP', { locale: de })}
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/settings')}
                >
                  {t('dashboard.settings')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  {t('dashboard.analytics')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Statistik-Karten */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatCard
                title={t('dashboard.stats.bookings')}
                value={statistics?.totalBookings || 0}
                icon={<EventIcon />}
                trend={{
                  value: statistics?.bookingsTrend || 0,
                  label: t('dashboard.stats.vsLastMonth'),
                }}
                loading={isLoadingStats}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatCard
                title={t('dashboard.stats.revenue')}
                value={formatCurrency(statistics?.totalRevenue || 0)}
                icon={<AnalyticsIcon />}
                trend={{
                  value: statistics?.revenueTrend || 0,
                  label: t('dashboard.stats.vsLastMonth'),
                }}
                loading={isLoadingStats}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatCard
                title={t('dashboard.stats.rating')}
                value={statistics?.averageRating?.toFixed(1) || '0.0'}
                icon={<StarIcon />}
                trend={{
                  value: statistics?.ratingTrend || 0,
                  label: t('dashboard.stats.vsLastMonth'),
                }}
                loading={isLoadingStats}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatCard
                title={t('dashboard.stats.messages')}
                value={messages?.length || 0}
                icon={<MessageIcon />}
                trend={{
                  value: statistics?.messagesTrend || 0,
                  label: t('dashboard.stats.vsLastMonth'),
                }}
                loading={isLoadingStats}
              />
            </motion.div>
          </Grid>
        </Grid>

        {/* Hauptinhalt */}
        <Grid container spacing={3}>
          {/* Chart */}
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  minHeight: 400,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {t('dashboard.charts.revenue')}
                </Typography>
                <DashboardChart
                  data={statistics?.revenueData || []}
                  loading={isLoadingStats}
                />
              </Paper>
            </motion.div>
          </Grid>

          {/* Aktuelle Buchungen */}
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  minHeight: 400,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    {t('dashboard.upcomingBookings')}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/bookings')}
                  >
                    {t('common.viewAll')}
                  </Button>
                </Box>
                <BookingList
                  bookings={bookings?.slice(0, 5) || []}
                  loading={isLoadingBookings}
                />
              </Paper>
            </motion.div>
          </Grid>

          {/* Letzte Nachrichten */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    {t('dashboard.recentMessages')}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate('/messages')}
                  >
                    {t('common.viewAll')}
                  </Button>
                </Box>
                <MessageList
                  messages={messages?.slice(0, 5) || []}
                  loading={isLoadingMessages}
                />
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard;