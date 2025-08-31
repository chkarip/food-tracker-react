import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  ClickAwayListener,
  Popper,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  label,
  disabled = false,
  error = false,
  helperText,
  size = 'medium',
  fullWidth = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelect = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleToggle();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      height: 36,
      fontSize: '0.875rem',
      padding: '8px 12px'
    },
    medium: {
      height: 44,
      fontSize: '1rem',
      padding: '10px 14px'
    },
    large: {
      height: 52,
      fontSize: '1.125rem',
      padding: '12px 16px'
    }
  };

  const currentSize = sizeConfig[size];

  return (
    <Box
      sx={{
        width: fullWidth ? '100%' : 'auto',
        position: 'relative'
      }}
      className={className}
    >
      {/* Label */}
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            fontWeight: 500,
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }}
        >
          {label}
        </Typography>
      )}

      {/* Select Button */}
      <Box
        ref={anchorRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
        sx={{
          width: '100%',
          height: currentSize.height,
          padding: currentSize.padding,
          backgroundColor: disabled ? 'var(--disabled-bg)' : 'var(--surface-bg)',
          border: `1px solid ${error ? 'var(--error-color)' : 'var(--border-color)'}`,
          borderRadius: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 200ms ease',
          opacity: disabled ? 0.6 : 1,
          '&:hover': {
            borderColor: disabled ? 'var(--border-color)' : 'var(--accent-blue)',
            backgroundColor: disabled ? 'var(--disabled-bg)' : 'var(--meal-row-bg)',
            boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
          },
          '&:focus': {
            outline: 'none',
            borderColor: 'var(--accent-blue)',
            boxShadow: '0 0 0 3px rgba(33, 150, 243, 0.1)'
          }
        }}
      >
        <Typography
          sx={{
            fontSize: currentSize.fontSize,
            color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: selectedOption ? 500 : 400,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Typography>

        <IconButton
          size="small"
          sx={{
            p: 0.5,
            color: 'var(--text-secondary)',
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'var(--accent-blue)'
            }
          }}
          disabled={disabled}
        >
          {isOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </IconButton>
      </Box>

      {/* Dropdown Menu */}
      <Popper
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{
              mt: 1,
              minWidth: anchorRef.current?.offsetWidth || 200,
              maxWidth: 400,
              maxHeight: 300,
              overflow: 'auto',
              borderRadius: 2,
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-bg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }}
          >
            <List
              role="listbox"
              sx={{
                p: 0,
                '& .MuiListItem-root': {
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'var(--meal-row-bg)'
                  }
                }
              }}
            >
              {options.map((option) => (
                <ListItem
                  key={option.value}
                  onClick={() => !option.disabled && handleSelect(option)}
                  sx={{
                    opacity: option.disabled ? 0.5 : 1,
                    cursor: option.disabled ? 'not-allowed' : 'pointer',
                    minHeight: currentSize.height,
                    backgroundColor: option.value === value ? 'var(--accent-blue-light)' : 'transparent',
                    '&:hover': {
                      backgroundColor: option.disabled ? 'transparent' : (option.value === value ? 'var(--accent-blue-light)' : 'var(--meal-row-bg)')
                    },
                    '& .MuiListItemText-primary': {
                      color: option.value === value ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontWeight: option.value === value ? 600 : 400
                    }
                  }}
                >
                  <ListItemText
                    primary={option.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: currentSize.fontSize
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>

      {/* Helper Text */}
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: 'block',
            color: error ? 'var(--error-color)' : 'var(--text-secondary)',
            fontSize: '0.75rem'
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default CustomSelect;
