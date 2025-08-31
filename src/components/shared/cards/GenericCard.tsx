import React from 'react';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { GenericCardProps } from './types';
import { getCardSx } from './variants';
import { Box } from '@mui/system';

export function GenericCard(props: GenericCardProps) {
  const {
    title,
    subtitle,
    icon,
    imageUrl,
    mediaAspect = '16:9',
    content,
    footer,
    actions = [],
    overflowActions = [],
    onRenderAction,
    variant = 'default',
    size = 'md',
    elevation = 1,
    disabled,
    loading,
    onClick,
    headerSlot,
    mediaSlot,
    bodySlot,
    footerSlot,
    highlight,
    sx,
  } = props;

  const visibleActions = actions.filter((a) => a.visible !== false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <Card
      elevation={elevation}
      onClick={onClick}
      sx={{
        ...getCardSx(variant, size, highlight),
        opacity: disabled ? 0.6 : 1,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        ...sx,
      }}
    >
      {headerSlot ?? (
        (title || subtitle || icon) && (
          <CardHeader
            avatar={icon}
            title={
              title ? (
                <Box
                  sx={{
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    opacity: 0.94,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -16,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      backgroundColor: 'var(--accent-green)',
                      borderRadius: '2px',
                    },
                    paddingLeft: '12px',
                  }}
                >
                  {title}
                </Box>
              ) : undefined
            }
            subheader={subtitle}
          />
        )
      )}

      {mediaSlot ??
        (imageUrl && (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={title}
            sx={{ aspectRatio: mediaAspect === 'auto' ? 'auto' : mediaAspect }}
          />
        ))}

      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? <CircularProgress size={20} /> : bodySlot ?? content}
      </CardContent>

      {(visibleActions.length > 0 || footer || footerSlot) && (
        <CardActions sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {visibleActions.map((a) =>
              onRenderAction ? (
                onRenderAction(a)
              ) : a.variant === 'icon' ? (
                <Tooltip key={a.id} title={a.tooltip ?? ''}>
                  <span>
                    <IconButton
                      onClick={a.onClick}
                      disabled={a.disabled}
                      aria-label={a['aria-label'] ?? a.label}
                      color={a.color === 'default' ? 'inherit' : a.color}
                    >
                      {a.icon}
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip key={a.id} title={a.tooltip ?? ''}>
                  <span>
                    <Button
                      onClick={a.onClick}
                      color={(a.color === 'default' ? 'inherit' : a.color) ?? 'primary'}
                      variant={a.variant ?? 'text'}
                      disabled={a.disabled}
                      startIcon={a.icon}
                    >
                      {a.label}
                    </Button>
                  </span>
                </Tooltip>
              )
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {overflowActions.length > 0 && (
              <IconButton aria-label="more" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            )}
            <div>{footerSlot ?? footer}</div>
          </div>
        </CardActions>
      )}
    </Card>
  );
}

export default GenericCard;
