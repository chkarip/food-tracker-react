/**
 * ToastContext.tsx - Global Toast Notification System
 * 
 * BUSINESS PURPOSE:
 * Provides a centralized toast notification system for the entire application.
 * Enables any component to show success, error, warning, or info messages
 * without duplicating Snackbar logic across components.
 * 
 * FEATURES:
 * - Global toast state management
 * - Multiple severity levels (success, error, warning, info)
 * - Auto-dismiss after configurable duration
 * - Bottom-center positioning for non-intrusive UX
 * - Simple API: showToast(message, type)
 * 
 * USAGE EXAMPLE:
 * ```tsx
 * const { showToast } = useToast();
 * showToast('Plan saved successfully!', 'success');
 * showToast('Failed to load data', 'error');
 * ```
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor, duration?: number) => void;
  hideToast: () => void;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 3000
  });

  const showToast = useCallback((
    message: string, 
    severity: AlertColor = 'info', 
    duration: number = 3000
  ) => {
    setToast({
      open: true,
      message,
      severity,
      duration
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Global Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Alert 
          onClose={hideToast} 
          severity={toast.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 'var(--elevation-2)'
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
