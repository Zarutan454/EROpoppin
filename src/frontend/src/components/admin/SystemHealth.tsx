import React from 'react';
import {
  Grid,
  LinearProgress,
  Typography,
  Box,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Memory as CPUIcon,
  Storage as MemoryIcon,
  Speed as LatencyIcon,
  CloudQueue as CacheIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

const SystemHealth: React.FC = () => {
  const [metrics, setMetrics] = React.useState<SystemMetric[]>([
    {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      icon: <CPUIcon />,
      status: 'success',
      details: '4/8 cores active',
    },
    {
      name: 'Memory Usage',
      value: 75,
      unit: '%',
      icon: <MemoryIcon />,
      status: 'warning',
      details: '12GB/16GB used',
    },
    {
      name: 'API Latency',
      value: 30,
      unit: 'ms',
      icon: <LatencyIcon />,
      status: 'success',
      details: 'Avg response time',
    },
    {
      name: 'Cache Hit Rate',
      value: 85,
      unit: '%',
      icon: <CacheIcon />,
      status: 'success',
      details: 'Redis cache status',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'info.main';
    }
  };

  const handleRefresh = () => {
    // Add API call to refresh metrics
    console.log('Refreshing metrics...');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">System Metrics</Typography>
        <Tooltip title="Refresh metrics">
          <IconButton size="small" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.name}>
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color: getStatusColor(metric.status), mr: 1 }}>
                  {metric.icon}
                </Box>
                <Typography variant="subtitle2">{metric.name}</Typography>
              </Box>

              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  color={metric.status as 'success' | 'warning' | 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  {metric.value}
                  {metric.unit}
                </Typography>
                <Tooltip title={metric.details || ''}>
                  <Typography variant="caption" color="textSecondary">
                    {metric.details}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SystemHealth;