import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Alert,
  Chip
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AuthDialog from './AuthDialog';

const OWNER_EMAIL = 'chriskaripian@gmail.com';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            maxWidth: 400
          }}
        >
          <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Authenticating...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your access.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Check if user is authenticated and authorized
  const isAuthorized = isAuthenticated && 
    user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (!isAuthorized) {
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 2
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={12}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <ShieldIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'primary.main', 
                  mb: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }} 
              />
              
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2563eb, #7c3aed)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Private Access Required
              </Typography>
              
              <Typography 
                variant="h6" 
                color="text.secondary" 
                gutterBottom
                sx={{ mb: 3 }}
              >
                Food Tracker & Meal Planner
              </Typography>

              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3, 
                  textAlign: 'left',
                  background: 'rgba(25, 118, 210, 0.1)',
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }}
              >
                This application is restricted to authorized users only. 
                Access is limited to maintain data privacy and security.
              </Alert>

              {isAuthenticated && user?.email !== OWNER_EMAIL && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 3, 
                    textAlign: 'left',
                    background: 'rgba(237, 108, 2, 0.1)',
                    border: '1px solid rgba(237, 108, 2, 0.2)'
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Access Denied</strong>
                  </Typography>
                  You are signed in as: <Chip 
                    label={user?.email || 'Unknown'} 
                    size="small" 
                    variant="outlined" 
                    sx={{ ml: 0.5 }}
                  />
                  <br />
                  This account is not authorized to access this application.
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<LockIcon />}
                  onClick={() => setAuthDialogOpen(true)}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {isAuthenticated ? 'Switch Account' : 'Sign In to Continue'}
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <SecurityIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Protected by Firebase Authentication
                </Typography>
              </Box>
            </Paper>
          </Container>
        </Box>

        <AuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
        />
      </>
    );
  }

  // User is authorized, render the app
  return <>{children}</>;
};

export default AuthGuard;
