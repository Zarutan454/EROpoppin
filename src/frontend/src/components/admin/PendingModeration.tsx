import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  ButtonGroup,
  Button,
  Box,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';

interface ModerationItem {
  id: string;
  type: 'review' | 'profile' | 'image' | 'report';
  content: string;
  submittedBy: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

const PriorityIndicator: React.FC<{ priority: string }> = ({ priority }) => {
  const getColor = () => {
    switch (priority) {
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      case 'low':
        return 'success.main';
      default:
        return 'info.main';
    }
  };

  return (
    <Box
      component="span"
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: getColor(),
        display: 'inline-block',
        marginRight: 1,
      }}
    />
  );
};

const PendingModeration: React.FC = () => {
  // Mock data - replace with actual API call
  const moderationItems: ModerationItem[] = [
    {
      id: '1',
      type: 'review',
      content: 'New review needs approval',
      submittedBy: 'user123',
      timestamp: '10 minutes ago',
      priority: 'high',
    },
    {
      id: '2',
      type: 'profile',
      content: 'Profile update requires verification',
      submittedBy: 'escort456',
      timestamp: '30 minutes ago',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'image',
      content: 'New profile image pending review',
      submittedBy: 'user789',
      timestamp: '1 hour ago',
      priority: 'low',
    },
    {
      id: '4',
      type: 'report',
      content: 'User reported for inappropriate behavior',
      submittedBy: 'moderator1',
      timestamp: '2 hours ago',
      priority: 'high',
    },
  ];

  const handleApprove = (id: string) => {
    console.log('Approved:', id);
  };

  const handleReject = (id: string) => {
    console.log('Rejected:', id);
  };

  const handleFlag = (id: string) => {
    console.log('Flagged:', id);
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <ButtonGroup size="small" variant="outlined">
          <Button>All</Button>
          <Button>Reviews</Button>
          <Button>Profiles</Button>
          <Button>Images</Button>
        </ButtonGroup>
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {moderationItems.map((item) => (
          <ListItem
            key={item.id}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <ListItemText
              primary={
                <Typography variant="subtitle2" component="div">
                  <PriorityIndicator priority={item.priority} />
                  {item.content}
                </Typography>
              }
              secondary={
                <>
                  <Typography variant="caption" component="div" color="textSecondary">
                    Submitted by: {item.submittedBy}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.timestamp}
                  </Typography>
                </>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                size="small"
                color="success"
                onClick={() => handleApprove(item.id)}
              >
                <ApproveIcon />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleReject(item.id)}
              >
                <RejectIcon />
              </IconButton>
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleFlag(item.id)}
              >
                <FlagIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default PendingModeration;