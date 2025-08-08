import React, { useState } from 'react';
import {
  TableCell,
  TableRow,
  IconButton,
  TextField,
  Box,
  Typography,
  Chip
} from '@mui/material';
import {
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { WorkoutExercise } from '../types/workout';
import NumericInput from './NumericInput';

interface WorkoutTableRowProps {
  exercise: WorkoutExercise;
  index: number;
  editingExercise: WorkoutExercise | null;
  editingField: string | null;
  onEditExercise: (exercise: WorkoutExercise, field?: keyof WorkoutExercise) => void;
  onStopEditing: () => void;
  onUpdateExercise: (field: keyof WorkoutExercise, value: string | number) => void;
  onDeleteExercise: (exerciseId: string) => void;
}

const WorkoutTableRow: React.FC<WorkoutTableRowProps> = ({
  exercise,
  index,
  editingExercise,
  editingField,
  onEditExercise,
  onStopEditing,
  onUpdateExercise,
  onDeleteExercise
}) => {
  const formatRestTime = (seconds: number): string => {
    const mins = Math.ceil(seconds / 60);
    return `${mins}m`;
  };

  // Handle clicking on a field - either start editing or switch fields
  const handleFieldClick = (field: keyof WorkoutExercise) => {
    // If we're already editing this exercise but different field, just switch fields
    if (editingExercise?.id === exercise.id && editingField !== field) {
      onEditExercise(exercise, field);
    }
    // If not editing this exercise at all, start editing
    else if (editingExercise?.id !== exercise.id) {
      onEditExercise(exercise, field);
    }
    // If already editing this exact field, do nothing (keep it active)
  };

  return (
    <TableRow 
      key={exercise.id} 
      hover 
      sx={{ 
        '& > *': { borderBottom: 'unset', py: 0.25 }, 
        height: '40px',
        // Full-row focus highlight when editing this exercise
        ...(editingExercise?.id === exercise.id && {
          backgroundColor: '#252525',
          borderLeft: '2px solid #2563EB',
          '& > *': { 
            borderBottom: 'unset', 
            py: 0.25,
            backgroundColor: 'transparent'
          }
        })
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            size="small"
            sx={{ 
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              color: 'text.secondary',
              '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
              p: 0.5
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
          <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 15, fontSize: '0.9rem' }}>
            {index + 1}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {exercise.name}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Chip 
          label={exercise.primaryMuscle}
          size="small"
          variant="filled"
          sx={{ 
            fontSize: '0.65rem', 
            fontWeight: 500,
            backgroundColor: 'primary.light',
            color: 'primary.dark',
            '&:hover': { backgroundColor: 'primary.main', color: 'white' },
            height: '18px',
            '& .MuiChip-label': { px: 1, py: 0 }
          }}
        />
      </TableCell>
      
      <TableCell>
        <Chip 
          label={exercise.equipment}
          size="small"
          variant="outlined"
          sx={{ 
            fontSize: '0.65rem', 
            fontWeight: 600,
            borderColor: 'text.secondary',
            color: 'text.secondary',
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
            height: '18px',
            '& .MuiChip-label': { px: 1, py: 0 }
          }}
        />
      </TableCell>

      <TableCell align="right">
        {editingExercise?.id === exercise.id && editingField === 'kg' ? (
          <NumericInput
            value={editingExercise.kg}
            onChange={(value) => onUpdateExercise('kg', value)}
            onBlur={onStopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onStopEditing();
              if (e.key === 'Escape') onStopEditing();
            }}
            min={0}
            max={999}
            step={0.5}
            width="90px"
            autoFocus
          />
        ) : (
          <Typography 
            variant="body1" 
            onClick={() => handleFieldClick('kg')}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
              fontWeight: 600,
              fontSize: '0.9rem',
              p: 0.25,
              borderRadius: 1,
              textAlign: 'right',
              minWidth: 35,
              userSelect: 'none'
            }}
          >
            {exercise.kg}
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        {editingExercise?.id === exercise.id && editingField === 'sets' ? (
          <NumericInput
            value={editingExercise.sets}
            onChange={(value) => onUpdateExercise('sets', value)}
            onBlur={onStopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onStopEditing();
              if (e.key === 'Escape') onStopEditing();
            }}
            min={1}
            max={10}
            step={1}
            width="80px"
            autoFocus
          />
        ) : (
          <Typography 
            variant="body1"
            onClick={() => handleFieldClick('sets')}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
              fontWeight: 600,
              fontSize: '0.9rem',
              p: 0.25,
              borderRadius: 1,
              textAlign: 'right',
              minWidth: 25,
              userSelect: 'none'
            }}
          >
            {exercise.sets}
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        {editingExercise?.id === exercise.id && editingField === 'reps' ? (
          <NumericInput
            value={editingExercise.reps}
            onChange={(value) => onUpdateExercise('reps', value)}
            onBlur={onStopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onStopEditing();
              if (e.key === 'Escape') onStopEditing();
            }}
            min={1}
            max={50}
            step={1}
            width="80px"
            autoFocus
          />
        ) : (
          <Typography 
            variant="body1"
            onClick={() => handleFieldClick('reps')}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
              fontWeight: 600,
              fontSize: '0.9rem',
              p: 0.25,
              borderRadius: 1,
              textAlign: 'right',
              minWidth: 25,
              userSelect: 'none'
            }}
          >
            {exercise.reps}
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        {editingExercise?.id === exercise.id && editingField === 'rest' ? (
          <NumericInput
            value={editingExercise.rest}
            onChange={(value) => onUpdateExercise('rest', value)}
            onBlur={onStopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onStopEditing();
              if (e.key === 'Escape') onStopEditing();
            }}
            min={30}
            max={600}
            step={15}
            width="90px"
            autoFocus
          />
        ) : (
          <Typography 
            variant="body1"
            onClick={() => handleFieldClick('rest')}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
              fontWeight: 600,
              fontSize: '0.9rem',
              p: 0.25,
              borderRadius: 1,
              textAlign: 'right',
              minWidth: 45,
              userSelect: 'none'
            }}
          >
            {formatRestTime(exercise.rest)}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        {editingExercise?.id === exercise.id && editingField === 'notes' ? (
          <TextField
            value={editingExercise.notes}
            onChange={(e) => onUpdateExercise('notes', e.target.value)}
            onBlur={onStopEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onStopEditing();
              }
              if (e.key === 'Escape') onStopEditing();
            }}
            size="small"
            multiline
            rows={2}
            placeholder="Add notes..."
            inputProps={{
              style: { fontSize: '0.9rem' }
            }}
            sx={{ 
              minWidth: '220px',
              '& .MuiOutlinedInput-root': { 
                backgroundColor: '#2A2A2A',
                outline: '2px solid #2563EB',
                border: 'none',
                '& fieldset': { 
                  border: 'none'
                },
                '& textarea::placeholder': {
                  opacity: 0.5,
                  transition: 'opacity 0.2s ease-in-out'
                }
              }
            }}
            autoFocus
          />
        ) : (
          <Typography 
            variant="body1"
            onClick={() => handleFieldClick('notes')}
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
              fontSize: '0.9rem',
              p: 0.5,
              borderRadius: 1,
              minWidth: 220,
              minHeight: 28,
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              userSelect: 'none'
            }}
          >
            {exercise.notes || 'Add notes...'}
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <IconButton 
            size="small"
            onClick={() => onDeleteExercise(exercise.id)}
            color="error"
            sx={{ p: 0.5 }}
            title="Delete exercise"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default WorkoutTableRow;
