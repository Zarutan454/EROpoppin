import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  earnings: {
    total: number;
    lastMonth: number;
    thisMonth: number;
    daily: Array<{ date: string; amount: number }>;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    monthly: Array<{ month: string; count: number }>;
  };
  profile: {
    views: number;
    favorites: number;
    contactRate: number;
    responseRate: number;
  };
  reviews: {
    total: number;
    average: number;
    distribution: Record<number, number>;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Earnings Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Earnings Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.earnings.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">
                  Total Earnings: ${data.earnings.total}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  This Month: ${data.earnings.thisMonth}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bookings Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bookings Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: data.bookings.completed },
                      { name: 'Cancelled', value: data.bookings.cancelled },
                      { name: 'Pending', value: data.bookings.pending },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.bookings.monthly.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">
                  Total Bookings: {data.bookings.total}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Completion Rate:{' '}
                  {((data.bookings.completed / data.bookings.total) * 100).toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Performance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">{data.profile.views}</Typography>
                  <Typography color="text.secondary">Profile Views</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">{data.profile.favorites}</Typography>
                  <Typography color="text.secondary">Favorites</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">
                    {(data.profile.contactRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography color="text.secondary">Contact Rate</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4">
                    {(data.profile.responseRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography color="text.secondary">Response Rate</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Reviews Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reviews Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(data.reviews.distribution).map(([rating, count]) => ({
                  rating,
                  count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">
                  Average Rating: {data.reviews.average.toFixed(1)}/5
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Reviews: {data.reviews.total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => fetchAnalytics()}>
          Refresh Data
        </Button>
      </Box>
    </Box>
  );
};