import React from 'react';
import { TextField, Box, IconButton } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: string;
  suffix?: string;
  autoFocus?: boolean;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  onBlur,
  onKeyDown,
  min = 0,
  max = 999,
  step = 1,
  width = '90px',
  suffix = '',
  autoFocus = false
}) => {
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.min(max, Math.max(min, newValue)));
    }
  };

  const handleSpinnerClick = (action: 'increment' | 'decrement') => (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent blur event
    e.stopPropagation(); // Stop event bubbling
    if (action === 'increment') {
      handleIncrement();
    } else {
      handleDecrement();
    }
  };

  const displayValue = suffix ? `${value}${suffix}` : value.toString();

  return (
    <Box sx={{ position: 'relative', width }}>
      <TextField
        type="number"
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        size="small"
        inputProps={{ 
          min, 
          max,
          step,
          style: { 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            textAlign: 'right',
            paddingRight: '32px' // Space for spinner buttons
          }
        }}
        sx={{ 
          width: '100%',
          '& .MuiOutlinedInput-root': { 
            backgroundColor: '#2A2A2A',
            outline: '2px solid #2563EB',
            border: 'none',
            '& fieldset': { 
              border: 'none'
            },
            '& input::placeholder': {
              opacity: 0.5,
              transition: 'opacity 0.2s ease-in-out'
            },
            // Hide native spinner
            '& input[type=number]': {
              '&::-webkit-outer-spin-button': {
                '-webkit-appearance': 'none',
                margin: 0
              },
              '&::-webkit-inner-spin-button': {
                '-webkit-appearance': 'none',
                margin: 0
              },
              '-moz-appearance': 'textfield'
            }
          }
        }}
        autoFocus={autoFocus}
      />
      
      {/* Custom spinner controls */}
      <Box sx={{ 
        position: 'absolute',
        right: '4px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1px'
      }}>
        <IconButton
          size="small"
          onMouseDown={handleSpinnerClick('increment')} // Use onMouseDown instead of onClick
          sx={{ 
            width: '20px', 
            height: '14px', 
            minHeight: '14px',
            minWidth: '20px',
            p: 0,
            color: '#2563EB',
            '&:hover': { 
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#1D4ED8'
            },
            '& svg': { fontSize: '14px' }
          }}
        >
          <KeyboardArrowUp />
        </IconButton>
        <IconButton
          size="small"
          onMouseDown={handleSpinnerClick('decrement')} // Use onMouseDown instead of onClick
          sx={{ 
            width: '20px', 
            height: '14px', 
            minHeight: '14px',
            minWidth: '20px',
            p: 0,
            color: '#2563EB',
            '&:hover': { 
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: '#1D4ED8'
            },
            '& svg': { fontSize: '14px' }
          }}
        >
          <KeyboardArrowDown />
        </IconButton>
      </Box>
    </Box>
  );
};

export default NumericInput;
