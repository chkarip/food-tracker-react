import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Autocomplete,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';

import  AccentButton  from '../shared/AccentButton';
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

interface ExerciseDialogProps {
  open: boolean;
  exercise: Exercise | null;
  exerciseForm: Omit<Exercise, 'id'>;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: Omit<Exercise, 'id'>) => void;
}

const ExerciseDialog: React.FC<ExerciseDialogProps> = ({
  open,
  exercise,
  exerciseForm,
  onClose,
  onSave,
  onFormChange
}) => {
  // Available muscle groups for autocomplete
  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core',
    'Front Deltoids', 'Rear Deltoids', 'Middle Deltoids',
    'Upper Back', 'Lower Back', 'Lats',
    'Upper Chest', 'Lower Chest',
    'Hip Flexors', 'Adductors', 'Abductors'
  ];

  const handleFormChange = (field: keyof Omit<Exercise, 'id'>, value: any) => {
    onFormChange({ ...exerciseForm, [field]: value });
  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {exercise ? 'Edit Exercise' : 'Add New Exercise'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Exercise Name"
            value={exerciseForm.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            fullWidth
            required
          />
          
          <FormControl fullWidth required>
            <InputLabel>Primary Muscle</InputLabel>
            <Select
              value={exerciseForm.primaryMuscle}
              label="Primary Muscle"
              onChange={(e) => handleFormChange('primaryMuscle', e.target.value)}
            >
              <MenuItem value="Chest">Chest</MenuItem>
              <MenuItem value="Back">Back</MenuItem>
              <MenuItem value="Shoulders">Shoulders</MenuItem>
              <MenuItem value="Biceps">Biceps</MenuItem>
              <MenuItem value="Triceps">Triceps</MenuItem>
              <MenuItem value="Forearms">Forearms</MenuItem>
              <MenuItem value="Quadriceps">Quadriceps</MenuItem>
              <MenuItem value="Hamstrings">Hamstrings</MenuItem>
              <MenuItem value="Glutes">Glutes</MenuItem>
              <MenuItem value="Calves">Calves</MenuItem>
              <MenuItem value="Core">Core</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={muscleGroups}
            value={exerciseForm.secondaryMuscles}
            onChange={(event, newValue) => {
              handleFormChange('secondaryMuscles', newValue);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Secondary Muscles"
                placeholder="Type to search and select muscles..."
                helperText="Search and click to add secondary muscles worked"
              />
            )}
            freeSolo={false}
            disableCloseOnSelect
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={exerciseForm.category}
              label="Category"
              onChange={(e) => handleFormChange('category', e.target.value as any)}
            >
              <MenuItem value="Compound">Compound</MenuItem>
              <MenuItem value="Isolation">Isolation</MenuItem>
              <MenuItem value="Isometric">Isometric</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Equipment</InputLabel>
            <Select
              value={exerciseForm.equipment}
              label="Equipment"
              onChange={(e) => handleFormChange('equipment', e.target.value)}
            >
              <MenuItem value="Dumbbells">Dumbbells</MenuItem>
              <MenuItem value="Barbells">Barbells</MenuItem>
              <MenuItem value="Cable Machine">Cable Machine</MenuItem>
              <MenuItem value="Bench">Bench</MenuItem>
              <MenuItem value="Pull-Up Bar">Pull-Up Bar</MenuItem>
              <MenuItem value="Squat Rack">Squat Rack</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Tier</InputLabel>
            <Select
              value={exerciseForm.difficulty}
              label="Tier"
              onChange={(e) => handleFormChange('difficulty', e.target.value as any)}
            >
              <MenuItem value="S Tier">S Tier</MenuItem>
              <MenuItem value="A Tier">A Tier</MenuItem>
              <MenuItem value="B Tier">B Tier</MenuItem>
              <MenuItem value="C Tier">C Tier</MenuItem>
              <MenuItem value="D Tier">D Tier</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Instructions"
            value={exerciseForm.instructions}
            onChange={(e) => handleFormChange('instructions', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <AccentButton 
          onClick={onClose}
          variant="secondary"
        >
          Cancel
        </AccentButton>
        <AccentButton 
          onClick={onSave}
          variant="primary"
          disabled={!exerciseForm.name || !exerciseForm.primaryMuscle || !exerciseForm.equipment}
        >
          {exercise ? '✏️ Update' : '➕ Add'} Exercise
        </AccentButton>
      </DialogActions>
    </Dialog>
  );
};

export default ExerciseDialog;
