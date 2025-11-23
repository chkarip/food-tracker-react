import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  CardActions,
  Tooltip
} from '@mui/material';

import  AccentButton  from '../shared/AccentButton';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Exercise interface matching Firebase structure
interface Exercise {
  id?: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  category: 'Compound' | 'Isolation' | 'Isometric';
  equipment: string;
  difficulty: 'S Tier' | 'A Tier' | 'B Tier' | 'C Tier' | 'D Tier';
  instructions?: string;
  isActive: boolean;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
  onAddToWorkout
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'S Tier': return 'error';
      case 'A Tier': return 'warning';
      case 'B Tier': return 'info';
      case 'C Tier': return 'success';
      case 'D Tier': return 'default';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Compound': return 'primary';
      case 'Isolation': return 'secondary';
      case 'Isometric': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {exercise.name}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={exercise.primaryMuscle} 
            color="primary" 
            size="small" 
            sx={{ mr: 1, mb: 1 }}
          />
          <Chip 
            label={exercise.category} 
            color={getCategoryColor(exercise.category) as any}
            variant="outlined" 
            size="small" 
            sx={{ mr: 1, mb: 1 }}
          />
          <Chip 
            label={exercise.difficulty} 
            color={getDifficultyColor(exercise.difficulty) as any}
            variant="outlined" 
            size="small" 
            sx={{ mb: 1 }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Equipment:</strong> {exercise.equipment}
        </Typography>

        {exercise.secondaryMuscles.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Secondary:</strong> {exercise.secondaryMuscles.join(', ')}
          </Typography>
        )}

        {exercise.instructions && (
          <Typography variant="body2" color="text.secondary" sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {exercise.instructions}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ 
        justifyContent: 'space-between', 
        pt: 0,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <AccentButton
          onClick={() => {
            if (onAddToWorkout) {
              onAddToWorkout(exercise);
            }
          }}
          variant="primary"
          style={{ width: '100%', minWidth: 'initial' }}
        >
          💪 Add to Workout
        </AccentButton>
        
        <Box sx={{ 
          display: 'flex',
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-end', sm: 'flex-start' }
        }}>
          <Tooltip title="Edit Exercise">
            <IconButton 
              size="small" 
              onClick={() => onEdit(exercise)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Exercise">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => onDelete(exercise.id!)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default ExerciseCard;
