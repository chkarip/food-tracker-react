import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Chip,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ModuleStats } from '../types';

interface ModuleStatCardProps {
  stats: ModuleStats;
  size?: 'small' | 'medium' | 'large';
}

const ModuleStatCard: React.FC<ModuleStatCardProps> = ({ stats, size = 'medium' }) => {
  const navigate = useNavigate();

  const getCardHeight = () => {
    switch (size) {
      case 'small': return 180;
      case 'large': return 280;
      default: return 220;
    }
  };

  const handleActionClick = () => {
    navigate(stats.actionButton.route);
  };

  return (
    <Card 
      sx={{ 
        height: getCardHeight(),
        borderRadius: 4,
        background: `linear-gradient(135deg, ${alpha(stats.gradient, 0.1)}, ${alpha(stats.gradient, 0.05)})`,
        border: `1px solid ${alpha(stats.gradient, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${alpha(stats.gradient, 0.2)}`,
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${stats.gradient}, ${alpha(stats.gradient, 0.8)})`,
              mr: 2,
              color: 'white'
            }}
          >
            {stats.icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {stats.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.description}
            </Typography>
          </Box>
        </Box>

        {/* Today Status */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Today
            </Typography>
            <Chip
              label={stats.todayStatus.label}
              size="small"
              color={stats.todayStatus.completed ? 'success' : 'default'}
              variant={stats.todayStatus.completed ? 'filled' : 'outlined'}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.todayStatus.progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(stats.gradient, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: `linear-gradient(90deg, ${stats.gradient}, ${alpha(stats.gradient, 0.8)})`,
              },
            }}
          />
        </Box>

        {/* Monthly Stats */}
        <Box sx={{ mb: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This Month
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: stats.gradient }}>
              {stats.monthlyStats.completed}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              / {stats.monthlyStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({stats.monthlyStats.percentage}%)
            </Typography>
          </Box>
          
          {/* Streak Info */}
          {stats.streakInfo && (
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Current: {stats.streakInfo.current} days
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Best: {stats.streakInfo.longest} days
              </Typography>
            </Box>
          )}
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          size="small"
          onClick={handleActionClick}
          sx={{
            background: `linear-gradient(135deg, ${stats.gradient}, ${alpha(stats.gradient, 0.8)})`,
            color: 'white',
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(stats.gradient, 0.9)}, ${alpha(stats.gradient, 0.7)})`,
            },
          }}
        >
          {stats.actionButton.label}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleStatCard;
