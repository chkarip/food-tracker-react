/**
 * AmountControls - Floating component for food amount selection and addition
 * ------------------------------------------------------------------
 * PURPOSE
 * • Provides a floating interface for setting food amounts and adding to meals
 * • Shows when a food is selected and floats in the bottom right corner
 * • Handles amount adjustment, preview updates, and meal addition
 *
 * RESPONSIBILITIES
 * • Display selected food name and amount controls
 * • Handle amount changes with live preview updates
 * • Provide Add to Meal and Clear actions
 * • Position as floating card on screen
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import AccentButton from '../shared/AccentButton';
import { NumberStepper } from '../shared/inputs';

interface AmountControlsProps {
  selectedFoodName: string;
  amount: number;
  onAmountChange: (amount: number) => void;
  onAddFood: () => void;
  onClearSelection: () => void;
  foodDatabase: any;
}

const AmountControls: React.FC<AmountControlsProps> = ({
  selectedFoodName,
  amount,
  onAmountChange,
  onAddFood,
  onClearSelection,
  foodDatabase,
}) => {
  if (!selectedFoodName) return null;

  return (
    <Box sx={{
      borderRadius: '12px',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--elevation-1)',
    }}>
      {/* Title Row - match other cards' header spacing */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-primary)',
            fontWeight: 700,
            opacity: 0.94,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              backgroundColor: 'var(--accent-green)',
              borderRadius: '2px'
            },
            paddingLeft: '12px'
          }}
        >
          {selectedFoodName}
        </Typography>
      </Box>

      {/* Controls Row */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'nowrap',
        px: 2,
        pb: 2
      }}>
        {/* Amount Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1.25,
          flex: 1,
          minWidth: 0
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'var(--text-secondary)', 
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Amount:
          </Typography>
          <Box sx={{ width: { xs: '120px', sm: '160px' } }}>
            <NumberStepper
              value={amount}
              onChange={onAmountChange}
              min={0}
              max={5000}
              step={foodDatabase[selectedFoodName]?.isUnitFood ? 1 : 5}
              unit={foodDatabase[selectedFoodName]?.isUnitFood ? 'units' : 'g'}
              size="medium"
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <AccentButton
            onClick={onClearSelection}
            variant="secondary"
            size="small"
            style={{
              minWidth: '80px',
              fontSize: '0.85rem',
              padding: '8px 12px'
            }}
          >
            Clear
          </AccentButton>

          <AccentButton
            onClick={onAddFood}
            disabled={!selectedFoodName}
            size="small"
            style={{ 
              minWidth: '120px',
              fontSize: '0.95rem',
              padding: '10px 18px'
            }}
          >
            Add to Meal
          </AccentButton>
        </Box>
      </Box>
    </Box>
  );
};

export default AmountControls;
