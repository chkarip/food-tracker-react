/**
 * RecipeTooltip.tsx
 * Displays recipe ingredients and instructions in a tooltip/popover
 * - Hover behavior on desktop
 * - Click to show/dismiss on mobile
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { Recipe } from '../../types/recipe';

interface RecipeTooltipProps {
  recipe: Recipe | null;
  loading: boolean;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  currentAmount?: number; // Current portion size user selected (in grams)
  baseServingSize?: number; // Original serving size from recipe (in grams)
}

export const RecipeTooltip: React.FC<RecipeTooltipProps> = ({
  recipe,
  loading,
  anchorEl,
  open,
  onClose,
  currentAmount,
  baseServingSize,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate scaling factor
  const scalingFactor = (currentAmount && baseServingSize && baseServingSize > 0)
    ? currentAmount / baseServingSize
    : 1;

  useEffect(() => {
    if (!anchorEl || !open) return;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 400; // Approximate max height
      
      let left = rect.right + 8; // 8px gap from icon
      let top = rect.top;

      // Check if tooltip would go off-screen to the right
      if (left + tooltipWidth > window.innerWidth) {
        left = rect.left - tooltipWidth - 8; // Show on left side instead
      }

      // Check if tooltip would go off-screen at bottom
      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 16;
      }

      // Ensure not above viewport
      if (top < 16) {
        top = 16;
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl, open]);

  if (!open || !anchorEl) return null;

  return (
    <>
      {/* Backdrop for mobile click-to-dismiss */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1299,
          display: { xs: 'block', md: 'none' }, // Only on mobile
        }}
      />

      {/* Tooltip content */}
      <Box
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => {
          // On desktop, close when mouse leaves. On mobile, don't close
          if (window.innerWidth >= 768) {
            onClose();
          }
        }}
        sx={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1300,
          backgroundColor: 'var(--card-bg)',
          border: '2px solid var(--accent-green)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          padding: '16px',
          maxWidth: '320px',
          maxHeight: '500px',
          overflowY: 'auto',
          animation: 'fadeIn 0.2s ease-out',
          '@keyframes fadeIn': {
            from: {
              opacity: 0,
              transform: 'scale(0.95)',
            },
            to: {
              opacity: 1,
              transform: 'scale(1)',
            },
          },
        }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: 'var(--accent-green)' }} />
          </Box>
        )}

        {!loading && recipe && (
          <>
            {/* Recipe name */}
            <Typography
              variant="h6"
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 700,
                mb: 1,
                fontSize: '1rem',
              }}
            >
              {recipe.name}
            </Typography>

            {/* Description */}
            {recipe.description && (
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--text-secondary)',
                  mb: 2,
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                }}
              >
                {recipe.description}
              </Typography>
            )}

            <Divider sx={{ mb: 2, borderColor: 'var(--border-color)' }} />

            {/* Ingredients */}
            <Typography
              variant="subtitle2"
              sx={{
                color: 'var(--accent-green)',
                fontWeight: 700,
                mb: 1,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🥕 Ingredients {scalingFactor !== 1 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                  (×{scalingFactor.toFixed(2)})
                </span>
              )}
            </Typography>
            <Box sx={{ mb: 2 }}>
              {recipe.ingredients.map((ingredient, idx) => {
                const scaledAmount = ingredient.amount * scalingFactor;
                const displayAmount = scaledAmount % 1 === 0 
                  ? scaledAmount.toFixed(0) 
                  : scaledAmount.toFixed(1);

                return (
                  <Box
                    key={ingredient.id || idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.5,
                      borderBottom: '1px solid var(--border-color)',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      {ingredient.foodName}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: scalingFactor !== 1 ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: scalingFactor !== 1 ? 700 : 600,
                        ml: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayAmount}
                      {ingredient.unit}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <>
                <Divider sx={{ mb: 2, borderColor: 'var(--border-color)' }} />
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'var(--accent-green)',
                    fontWeight: 700,
                    mb: 1,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  📝 Instructions
                </Typography>
                <Box>
                  {recipe.instructions
                    .filter((inst) => inst && inst.trim())
                    .map((instruction, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          gap: 1,
                          mb: 1.5,
                          '&:last-child': { mb: 0 },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--accent-green)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            minWidth: '20px',
                          }}
                        >
                          {idx + 1}.
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {instruction}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </>
            )}

            {/* Servings info */}
            <Divider sx={{ my: 2, borderColor: 'var(--border-color)' }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                }}
              >
                Servings: {recipe.servings}
              </Typography>
              {recipe.cookingTime && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                  }}
                >
                  ⏱️ {recipe.cookingTime} min
                </Typography>
              )}
            </Box>
          </>
        )}

        {!loading && !recipe && (
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', textAlign: 'center', py: 2 }}
          >
            Recipe details not available
          </Typography>
        )}
      </Box>
    </>
  );
};
