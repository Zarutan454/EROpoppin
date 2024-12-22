import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import PendingModeration from './PendingModeration';
import SystemHealth from './SystemHealth';

const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const Dashboard: React.FC = () => {
  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        {/* Stats Overview */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Users"
            value="1,234"
            trend="+12%"
            period="vs last month"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Active Bookings"
            value="156"
            trend="+8%"
            period="vs last month"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Revenue"
            value="$45,678"
            trend="+15%"
            period="vs last month"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="New Reviews"
            value="89"
            trend="+5%"
            period="vs last month"
          />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <RecentActivity />
          </Paper>
        </Grid>

        {/* Pending Moderation */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Pending Moderation
            </Typography>
            <PendingModeration />
          </Paper>
        </Grid>

        {/* System Health */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <SystemHealth />
          </Paper>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;