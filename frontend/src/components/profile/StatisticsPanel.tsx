import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  views: number;
  bookings: number;
  rating: number;
  ratingCount: number;
  responseRate: number;
  responseTime: number;
}

interface StatisticsPanelProps {
  stats: Stats;
}

export function StatisticsPanel({ stats }: StatisticsPanelProps) {
  const [timeRange, setTimeRange] = useState('7d');

  // Sample data - in a real app, this would come from the backend
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), 'dd.MM.'),
    views: Math.floor(Math.random() * 50),
    bookings: Math.floor(Math.random() * 10),
  }));

  function getTimeRangeLabel() {
    switch (timeRange) {
      case '7d':
        return 'Letzte 7 Tage';
      case '30d':
        return 'Letzte 30 Tage';
      case '90d':
        return 'Letzte 90 Tage';
      default:
        return '';
    }
  }

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Zeitraum</InputLabel>
          <Select
            value={timeRange}
            label="Zeitraum"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7d">Letzte 7 Tage</MenuItem>
            <MenuItem value="30d">Letzte 30 Tage</MenuItem>
            <MenuItem value="90d">Letzte 90 Tage</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined">
          Export als CSV
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Profilaufrufe
              </Typography>
              <Typography variant="h4">
                {stats.views.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                +{Math.floor(Math.random() * 20)}% gegenüber Vorwoche
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Buchungen
              </Typography>
              <Typography variant="h4">
                {stats.bookings.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                +{Math.floor(Math.random() * 15)}% gegenüber Vorwoche
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Bewertung
              </Typography>
              <Typography variant="h4">
                {stats.rating.toFixed(1)} / 5.0
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Basierend auf {stats.ratingCount} Bewertungen
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Antwortrate
              </Typography>
              <Typography variant="h4">
                {stats.responseRate}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Ø Antwortzeit: {stats.responseTime} Min.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profilaufrufe
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Buchungen
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance-Metriken
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Antwortrate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stats.responseRate}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        0%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stats.responseRate}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Buchungsrate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.bookings / stats.views) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        0%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {((stats.bookings / stats.views) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Kundenzufriedenheit
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.rating / 5) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        0
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {stats.rating.toFixed(1)} / 5.0
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Profilvollständigkeit
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={85} // This would be calculated based on profile completeness
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        0%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        85%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}