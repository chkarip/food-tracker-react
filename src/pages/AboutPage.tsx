/**
 * AboutPage.tsx - About page with legal compliance and attribution
 *
 * Includes mandatory legal requirements:
 * - Privacy Policy link
 * - Terms of Service link
 * - Open Food Facts attribution
 * - Contact information
 * - App version info
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Link,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  Info as InfoIcon,
  PrivacyTip as PrivacyIcon,
  Gavel as LegalIcon,
  ContactMail as ContactIcon,
  Update as UpdateIcon,
  Attribution as AttributionIcon
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Box sx={{ maxWidth: '80%', mx: 'auto', p: 2 }} className="content-container-80">
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'var(--text-primary)',
            mb: 2,
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-green) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          About Track Everything
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'var(--text-secondary)',
            fontWeight: 400,
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          Your comprehensive platform for tracking nutrition, fitness, and finances
        </Typography>
      </Box>

      {/* Mission Statement */}
      <Card
        elevation={1}
        sx={{
          mb: 3,
          backgroundColor: 'var(--surface-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'var(--accent-blue)' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Our Mission
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Track Everything is designed to empower you with complete visibility into your health and financial journey.
            We combine nutrition tracking, workout planning, and expense management into one seamless platform,
            helping you make informed decisions about your wellness and wealth.
          </Typography>
        </CardContent>
      </Card>

      {/* Data Sources & Attribution */}
      <Card
        elevation={1}
        sx={{
          mb: 3,
          backgroundColor: 'var(--surface-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AttributionIcon sx={{ mr: 1, color: 'var(--accent-green)' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Data Sources
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            We partner with trusted data providers to ensure accurate nutrition information:
          </Typography>
          <Box sx={{
            p: 2,
            backgroundColor: 'var(--meal-row-bg)',
            borderRadius: 2,
            border: '1px solid var(--border-color)'
          }}>
            <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              🍎 Food nutrition data powered by{' '}
              <Link
                href="https://openfoodfacts.org"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Open Food Facts
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 1 }}>
              Open Food Facts is a collaborative, free and open database of food products from around the world.
              Their mission is to help consumers make better food choices by providing transparent information about what they eat.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Legal & Privacy - MANDATORY */}
      <Card
        elevation={1}
        sx={{
          mb: 3,
          backgroundColor: 'var(--surface-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 3,
          borderLeft: '4px solid var(--warning-color)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LegalIcon sx={{ mr: 1, color: 'var(--warning-color)' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Legal & Privacy
            </Typography>
            <Chip
              label="MANDATORY"
              size="small"
              sx={{
                ml: 2,
                backgroundColor: 'var(--warning-color)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
            Your privacy and data protection are our top priorities. We comply with GDPR and other privacy regulations.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{
              p: 2,
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)',
              flex: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PrivacyIcon sx={{ mr: 1, color: 'var(--accent-purple)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Privacy Policy
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                How we collect, use, and protect your personal and health data.
              </Typography>
              <Link
                href="/privacy"
                sx={{
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Read Privacy Policy →
              </Link>
            </Box>

            <Box sx={{
              p: 2,
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)',
              flex: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LegalIcon sx={{ mr: 1, color: 'var(--accent-blue)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Terms of Service
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                Rules for using our platform and user responsibilities.
              </Typography>
              <Link
                href="/terms"
                sx={{
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Read Terms of Service →
              </Link>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <Card
        elevation={1}
        sx={{
          mb: 3,
          backgroundColor: 'var(--surface-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ContactIcon sx={{ mr: 1, color: 'var(--accent-green)' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Contact & Support
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            Need help or have questions? We're here to support you.
          </Typography>

          <Stack spacing={2}>
            <Box sx={{
              p: 2,
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)'
            }}>
              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                📧 Email Support
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                support@trackeverything.app
              </Typography>
            </Box>

            <Box sx={{
              p: 2,
              backgroundColor: 'var(--meal-row-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)'
            }}>
              <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                🐛 Bug Reports & Feature Requests
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Found an issue or have a suggestion? Let us know!
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card
        elevation={1}
        sx={{
          backgroundColor: 'var(--surface-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <UpdateIcon sx={{ mr: 1, color: 'var(--accent-purple)' }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              App Information
            </Typography>
          </Box>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                Version:
              </Typography>
              <Chip
                label="1.0.0"
                size="small"
                sx={{
                  backgroundColor: 'var(--accent-green)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Box>

            <Divider sx={{ my: 1, borderColor: 'var(--border-color)' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                Last Updated:
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {currentDate}
              </Typography>
            </Box>

            <Divider sx={{ my: 1, borderColor: 'var(--border-color)' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                Platform:
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Web Application
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Footer Attribution */}
      <Box sx={{ textAlign: 'center', mt: 4, py: 2 }}>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          © 2025 Track Everything. Made with ❤️ for better health and wealth tracking.
        </Typography>
      </Box>
    </Box>
  );
};

export default AboutPage;