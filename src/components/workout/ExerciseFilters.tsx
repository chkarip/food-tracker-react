import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import  AccentButton  from '../shared/AccentButton';
import {
  Search as SearchIcon,
} from '@mui/icons-material';

interface ExerciseFiltersProps {
  searchTerm: string;
  filterMuscle: string;
  filterDifficulty: string;
  uniqueMuscles: string[];
  onSearchChange: (value: string) => void;
  onMuscleChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onClearFilters: () => void;
}

const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({
  searchTerm,
  filterMuscle,
  filterDifficulty,
  uniqueMuscles,
  onSearchChange,
  onMuscleChange,
  onDifficultyChange,
  onClearFilters
}) => {
  return (
    <Box sx={{ 
      mb: 3, 
      display: 'flex', 
      gap: 2, 
      flexWrap: 'wrap', 
      alignItems: 'center',
      flexDirection: { xs: 'column', sm: 'row' }
    }}>
      <TextField
        placeholder="Search exercises..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: { xs: '100%', sm: 250 }, flex: { xs: 1, sm: 'initial' } }}
      />
      
      <FormControl sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: 1, sm: 'initial' } }}>
        <InputLabel>Muscle Group</InputLabel>
        <Select
          value={filterMuscle}
          label="Muscle Group"
          onChange={(e) => onMuscleChange(e.target.value)}
        >
          <MenuItem value="">All Muscles</MenuItem>
          {uniqueMuscles.map(muscle => (
            <MenuItem key={muscle} value={muscle}>{muscle}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: '100%', sm: 130 }, flex: { xs: 1, sm: 'initial' } }}>
        <InputLabel>Tier</InputLabel>
        <Select
          value={filterDifficulty}
          label="Tier"
          onChange={(e) => onDifficultyChange(e.target.value)}
        >
          <MenuItem value="">All Tiers</MenuItem>
          <MenuItem value="S Tier">S Tier</MenuItem>
          <MenuItem value="A Tier">A Tier</MenuItem>
          <MenuItem value="B Tier">B Tier</MenuItem>
          <MenuItem value="C Tier">C Tier</MenuItem>
          <MenuItem value="D Tier">D Tier</MenuItem>
        </Select>
      </FormControl>

      <AccentButton
        onClick={onClearFilters}
        variant="secondary"
        style={{ width: '100%', minWidth: 'initial' }}
      >
        🧹 Clear Filters
      </AccentButton>
    </Box>
  );
};

export default ExerciseFilters;
