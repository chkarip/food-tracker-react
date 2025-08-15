import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Lock as LockIcon } from '@mui/icons-material';
import { signInWithEmail, resetPassword } from '../../services/firebase/authService';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const OWNER_EMAIL = 'chriskaripian@gmail.com';

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Check if email matches owner email
    if (email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      setError('Access denied. This app is for authorized users only.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('Access denied. This app is for authorized users only.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      setError('Password reset is only available for authorized users.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
      setShowPasswordReset(false);
    } catch (error: any) {
      setError('Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    setShowPasswordReset(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="primary" />
          <Typography variant="h6">
            Private Access Required
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This app is restricted to authorized users only. Please sign in with your credentials.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!showPasswordReset ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={loading}
              autoComplete="email"
              placeholder="Enter your authorized email"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              disabled={loading}
              autoComplete="current-password"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSignIn();
                }
              }}
            />
            <Button
              variant="text"
              onClick={() => setShowPasswordReset(true)}
              disabled={loading}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Forgot your password?
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your email address to receive a password reset link.
            </Typography>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={loading}
              autoComplete="email"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="text"
                onClick={() => setShowPasswordReset(false)}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                Back to Sign In
              </Button>
              <Button
                variant="contained"
                onClick={handlePasswordReset}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      {!showPasswordReset && (
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSignIn}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AuthDialog;
