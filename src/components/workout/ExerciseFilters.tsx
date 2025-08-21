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
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
        sx={{ minWidth: 250 }}
      />
      
      <FormControl sx={{ minWidth: 150 }}>
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

      <FormControl sx={{ minWidth: 130 }}>
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
      >
        🧹 Clear Filters
      </AccentButton>
    </Box>
  );
};

export default ExerciseFilters;
