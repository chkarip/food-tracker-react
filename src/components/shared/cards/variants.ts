import { SxProps } from '@mui/material';
import { GenericCardVariant, GenericCardSize } from './types';

export function getCardSx(
  variant: GenericCardVariant,
  size: GenericCardSize,
  highlight?: boolean
): SxProps {
  const base: SxProps = {
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    transition:
      'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
    '&:hover': {
      backgroundColor: 'var(--card-hover-bg)',
      boxShadow: 'var(--elevation-2)',
      borderColor: 'var(--border-color)',
    },
  };

  const sizeMap: Record<GenericCardSize, SxProps> = {
    sm: {
      p: 1.25,
      '& .MuiCardHeader-root': { p: 1 },
      '& .MuiCardContent-root': { p: 1 },
      '& .MuiCardActions-root': { p: 1 },
    },
    md: { p: 1.75 },
    lg: { p: 2.25 },
  };

  const variantMap: Record<GenericCardVariant, SxProps> = {
    default: {},
    recipe: {
      background:
        'linear-gradient(135deg, var(--card-bg) 0%, rgba(59, 186, 117, 0.05) 100%)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--accent-green)',
      boxShadow: 'var(--elevation-1)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'linear-gradient(135deg, rgba(59, 186, 117, 0.03) 0%, rgba(59, 186, 117, 0.02) 50%, rgba(59, 186, 117, 0.01) 100%)',
        borderRadius: '12px',
        pointerEvents: 'none',
      },
      '&:hover': {
        background:
          'linear-gradient(135deg, var(--card-hover-bg) 0%, rgba(59, 186, 117, 0.08) 100%)',
        boxShadow: 'var(--elevation-2)',
        transform: 'translateY(-2px)',
        '&::before': {
          background:
            'linear-gradient(135deg, rgba(59, 186, 117, 0.05) 0%, rgba(59, 186, 117, 0.03) 50%, rgba(59, 186, 117, 0.02) 100%)',
        },
      },
    },
    summary: {
      background:
        'linear-gradient(135deg, var(--card-bg) 0%, rgba(33, 150, 243, 0.05) 100%)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--accent-blue)',
      boxShadow: 'var(--elevation-1)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'linear-gradient(135deg, rgba(33, 150, 243, 0.03) 0%, rgba(33, 150, 243, 0.02) 50%, rgba(33, 150, 243, 0.01) 100%)',
        borderRadius: '12px',
        pointerEvents: 'none',
      },
      '&:hover': {
        background:
          'linear-gradient(135deg, var(--card-hover-bg) 0%, rgba(33, 150, 243, 0.08) 100%)',
        boxShadow: 'var(--elevation-2)',
        transform: 'translateY(-2px)',
        '&::before': {
          background:
            'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.03) 50%, rgba(33, 150, 243, 0.02) 100%)',
        },
      },
    },
    exercise: {
      background:
        'linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 152, 0, 0.05) 100%)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--accent-orange)',
      boxShadow: 'var(--elevation-1)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          'linear-gradient(135deg, rgba(255, 152, 0, 0.03) 0%, rgba(255, 152, 0, 0.02) 50%, rgba(255, 152, 0, 0.01) 100%)',
        borderRadius: '12px',
        pointerEvents: 'none',
      },
      '&:hover': {
        background:
          'linear-gradient(135deg, var(--card-hover-bg) 0%, rgba(255, 152, 0, 0.08) 100%)',
        boxShadow: 'var(--elevation-2)',
        transform: 'translateY(-2px)',
        '&::before': {
          background:
            'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.03) 50%, rgba(255, 152, 0, 0.02) 100%)',
        },
      },
    },
  };

  const hl: SxProps = highlight
    ? { outline: '2px solid var(--accent-green)', outlineOffset: '2px' }
    : {};

  return { ...base, ...sizeMap[size], ...variantMap[variant], ...hl } as SxProps;
}
