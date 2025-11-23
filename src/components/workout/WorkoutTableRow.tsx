import React from 'react';
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
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { WorkoutExercise } from '../../types/workout';
import NumericInput from '../shared/NumericInput';

interface WorkoutTableRowProps {
  exercise: WorkoutExercise;
  index: number;
  editingExercise: WorkoutExercise | null;
  editingField: string | null;
  onEditExercise: (exercise: WorkoutExercise, field?: keyof WorkoutExercise) => void;
  onStopEditing: () => void;
  onUpdateExercise: (field: keyof WorkoutExercise, value: string | number) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onMoveExercise: (exerciseId: string, direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const WorkoutTableRow: React.FC<WorkoutTableRowProps> = ({
  exercise,
  index,
  editingExercise,
  editingField,
  onEditExercise,
  onStopEditing,
  onUpdateExercise,
  onDeleteExercise,
  onMoveExercise,
  canMoveUp,
  canMoveDown
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <IconButton 
              size="small"
              onClick={() => onMoveExercise(exercise.id, 'up')}
              disabled={!canMoveUp}
              sx={{ 
                p: 0.25,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
                '&:disabled': { opacity: 0.3 }
              }}
              title="Move up"
            >
              <ArrowUpIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton 
              size="small"
              onClick={() => onMoveExercise(exercise.id, 'down')}
              disabled={!canMoveDown}
              sx={{ 
                p: 0.25,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' },
                '&:disabled': { opacity: 0.3 }
              }}
              title="Move down"
            >
              <ArrowDownIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 600, minWidth: 15, fontSize: '0.9rem' }}>
            {index + 1}
          </Typography>
        </Box>
      </TableCell>
      
      <TableCell>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
            {exercise.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
          </Box>
        </Box>
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

// Mobile Card View Component
export const WorkoutTableRowMobile: React.FC<WorkoutTableRowProps> = ({
  exercise,
  index,
  editingExercise,
  editingField,
  onEditExercise,
  onStopEditing,
  onUpdateExercise,
  onDeleteExercise,
  onMoveExercise,
  canMoveUp,
  canMoveDown
}) => {
  const formatRestTime = (seconds: number): string => {
    const mins = Math.ceil(seconds / 60);
    return `${mins}m`;
  };

  const handleFieldClick = (field: keyof WorkoutExercise) => {
    if (editingExercise?.id === exercise.id && editingField !== field) {
      onEditExercise(exercise, field);
    } else if (editingExercise?.id !== exercise.id) {
      onEditExercise(exercise, field);
    }
  };

  return (
    <Box
      sx={{
        mb: 2,
        borderRadius: 2,
        border: '1px solid var(--border-color)',
        bgcolor: 'var(--card-bg)',
        overflow: 'hidden',
        ...(editingExercise?.id === exercise.id && {
          backgroundColor: '#252525',
          borderLeft: '3px solid #2563EB',
        })
      }}
    >
      {/* Header: Order, Name, Actions - STICKY */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        p: 2,
        pb: 1.5,
        position: 'sticky',
        top: 0,
        bgcolor: 'var(--card-bg)',
        zIndex: 1,
        borderBottom: '1px solid var(--border-color)',
        ...(editingExercise?.id === exercise.id && {
          backgroundColor: '#252525',
        })
      }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              #{index + 1}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {exercise.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip 
              label={exercise.primaryMuscle}
              size="small"
              variant="filled"
              sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 500,
                backgroundColor: 'primary.light',
                color: 'primary.dark',
                height: '20px',
                '& .MuiChip-label': { px: 1, py: 0 }
              }}
            />
            <Chip 
              label={exercise.equipment}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 600,
                borderColor: 'text.secondary',
                color: 'text.secondary',
                height: '20px',
                '& .MuiChip-label': { px: 1, py: 0 }
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              size="small"
              onClick={() => onMoveExercise(exercise.id, 'up')}
              disabled={!canMoveUp}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              <ArrowUpIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton 
              size="small"
              onClick={() => onMoveExercise(exercise.id, 'down')}
              disabled={!canMoveDown}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              <ArrowDownIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <IconButton 
            size="small"
            onClick={() => onDeleteExercise(exercise.id)}
            color="error"
            sx={{ p: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 1.5,
        p: 2,
        pt: 1.5
      }}>
        {/* KG */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            KG
          </Typography>
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
              width="100%"
              autoFocus
            />
          ) : (
            <Typography 
              variant="body2" 
              onClick={() => handleFieldClick('kg')}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {exercise.kg}
            </Typography>
          )}
        </Box>

        {/* Sets */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            Sets
          </Typography>
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
              width="100%"
              autoFocus
            />
          ) : (
            <Typography 
              variant="body2"
              onClick={() => handleFieldClick('sets')}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {exercise.sets}
            </Typography>
          )}
        </Box>

        {/* Reps */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            Reps
          </Typography>
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
              width="100%"
              autoFocus
            />
          ) : (
            <Typography 
              variant="body2"
              onClick={() => handleFieldClick('reps')}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {exercise.reps}
            </Typography>
          )}
        </Box>

        {/* Rest */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            Rest
          </Typography>
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
              width="100%"
              autoFocus
            />
          ) : (
            <Typography 
              variant="body2"
              onClick={() => handleFieldClick('rest')}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {formatRestTime(exercise.rest)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Notes */}
      <Box sx={{ p: 2, pt: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
          Notes
        </Typography>
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
            fullWidth
            placeholder="Add notes..."
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                backgroundColor: '#2A2A2A',
                fontSize: '0.9rem'
              }
            }}
            autoFocus
          />
        ) : (
          <Typography 
            variant="body2"
            onClick={() => handleFieldClick('notes')}
            sx={{ 
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: exercise.notes ? 'text.primary' : 'text.secondary',
              p: 1,
              borderRadius: 1,
              border: '1px solid var(--border-color)',
              minHeight: 40,
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            {exercise.notes || 'Add notes...'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WorkoutTableRow;
