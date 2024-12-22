import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  period: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const TrendIndicator = styled(Box)<{ trend: string }>(({ theme, trend }) => ({
  display: 'flex',
  alignItems: 'center',
  color: trend.startsWith('+') ? theme.palette.success.main : theme.palette.error.main,
  '& svg': {
    marginRight: theme.spacing(0.5),
  },
}));

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, period }) => {
  const isTrendPositive = trend.startsWith('+');

  return (
    <StyledPaper elevation={2}>
      <Typography variant="subtitle2" color="textSecondary">
        {title}
      </Typography>
      
      <Typography variant="h4" component="div" sx={{ my: 2 }}>
        {value}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TrendIndicator trend={trend}>
          {isTrendPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          <Typography variant="body2">{trend}</Typography>
        </TrendIndicator>
        
        <Typography variant="caption" color="textSecondary">
          {period}
        </Typography>
      </Box>
    </StyledPaper>
  );
};

export default StatCard;