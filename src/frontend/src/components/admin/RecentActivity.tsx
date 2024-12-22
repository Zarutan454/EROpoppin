import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AccountCircle as UserIcon,
  Payment as PaymentIcon,
  RateReview as ReviewIcon,
  Report as ReportIcon,
} from '@mui/icons-material';

interface Activity {
  id: string;
  type: 'user' | 'payment' | 'review' | 'report';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const StatusChip = styled(Chip)<{ status?: string }>(({ theme, status }) => ({
  marginLeft: theme.spacing(1),
  backgroundColor: status === 'success'
    ? theme.palette.success.light
    : status === 'warning'
    ? theme.palette.warning.light
    : status === 'error'
    ? theme.palette.error.light
    : theme.palette.info.light,
  color: theme.palette.getContrastText(
    status === 'success'
      ? theme.palette.success.light
      : status === 'warning'
      ? theme.palette.warning.light
      : status === 'error'
      ? theme.palette.error.light
      : theme.palette.info.light
  ),
}));

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user':
      return <UserIcon />;
    case 'payment':
      return <PaymentIcon />;
    case 'review':
      return <ReviewIcon />;
    case 'report':
      return <ReportIcon />;
    default:
      return <UserIcon />;
  }
};

const RecentActivity: React.FC = () => {
  // Mock data - replace with actual API call
  const activities: Activity[] = [
    {
      id: '1',
      type: 'user',
      title: 'New User Registration',
      description: 'John Doe registered as an escort',
      timestamp: '5 minutes ago',
      status: 'success',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Received',
      description: 'Booking #1234 payment confirmed',
      timestamp: '10 minutes ago',
      status: 'success',
    },
    {
      id: '3',
      type: 'review',
      title: 'New Review',
      description: 'Jane Smith left a 5-star review',
      timestamp: '15 minutes ago',
      status: 'info',
    },
    {
      id: '4',
      type: 'report',
      title: 'Content Reported',
      description: 'Profile #5678 was reported for inappropriate content',
      timestamp: '30 minutes ago',
      status: 'warning',
    },
  ];

  return (
    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
      {activities.map((activity) => (
        <StyledListItem key={activity.id}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'primary.light' }}>
              {getActivityIcon(activity.type)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="subtitle2" component="div">
                {activity.title}
                {activity.status && (
                  <StatusChip
                    label={activity.status}
                    size="small"
                    status={activity.status}
                  />
                )}
              </Typography>
            }
            secondary={
              <>
                <Typography variant="body2" color="textSecondary">
                  {activity.description}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {activity.timestamp}
                </Typography>
              </>
            }
          />
        </StyledListItem>
      ))}
    </List>
  );
};

export default RecentActivity;