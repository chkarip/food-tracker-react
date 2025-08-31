import React from 'react';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LaunchIcon from '@mui/icons-material/Launch';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';

import { GenericCard } from '../shared/cards/GenericCard';
import { GenericCardProps, CardAction } from '../shared/cards/types';
import { fmt1 } from '../../utils/number';

type OwnProps = {
  recipeName: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: string[];
  tags?: string[];
  instructions?: string[];
  onViewRecipe?: () => void;
  onAddToMeal?: () => void;
  onSaveRecipe?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
};

export type RecipeCardProps = Omit<GenericCardProps, 'variant' | 'icon' | 'title' | 'subtitle' | 'content' | 'actions'> & OwnProps;

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipeName,
  calories,
  protein,
  carbs,
  fats,
  prepTime,
  cookTime,
  servings,
  ingredients = [],
  tags = [],
  instructions = [],
  onViewRecipe,
  onAddToMeal,
  onSaveRecipe,
  onDelete,
  onToggleFavorite,
  isFavorite = false,
  ...props
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    handleMenuClose();
  };

  const actions: CardAction[] = [
    onViewRecipe && { id: 'view', label: 'View', icon: <LaunchIcon />, color: 'primary', variant: 'contained', onClick: onViewRecipe },
    onAddToMeal && { id: 'add', label: 'Add to Meal', icon: <PlaylistAddIcon />, color: 'success', variant: 'outlined', onClick: onAddToMeal },
    onToggleFavorite && {
      id: 'fav',
      label: 'Favorite',
      icon: isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />,
      variant: 'icon',
      color: isFavorite ? 'error' : 'default',
      tooltip: isFavorite ? 'Remove from favorites' : 'Add to favorites',
      onClick: onToggleFavorite
    },
  ].filter(Boolean) as CardAction[];

  // Custom header with 3-dots menu
  const headerSlot = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 16px 8px 16px',
      borderBottom: '1px solid var(--card-border-light, rgba(0,0,0,0.08))',
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-green, #10b981) 0%, var(--accent-green-hover, #059669) 100%)',
          borderRadius: '8px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <RestaurantIcon style={{ color: 'white', fontSize: '20px' }} />
        </div>
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            {recipeName}
          </div>
        </div>
      </div>
      <IconButton
        onClick={handleMenuOpen}
        size="small"
        sx={{
          color: 'var(--text-secondary)',
          '&:hover': {
            backgroundColor: 'var(--card-hover-bg)',
            color: 'var(--text-primary)'
          }
        }}
        aria-label="More options"
      >
        <MoreVertIcon />
      </IconButton>
    </div>
  );

  const macroInfo =
    [protein, carbs, fats, calories].some(v => v !== undefined) ? (
      <div style={{
        display: 'flex',
        gap: 16,
        color: 'var(--text-secondary)',
        background: 'linear-gradient(135deg, var(--card-hover-bg, rgba(255,255,255,0.08)) 0%, var(--card-hover-bg, rgba(255,255,255,0.06)) 100%)',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--card-border-light, rgba(0,0,0,0.08))',
        fontWeight: 500
      }}>
        {typeof protein === 'number' && <span style={{ fontWeight: 500 }}>Protein: {fmt1(protein)}g</span>}
        {typeof carbs === 'number' && <span style={{ fontWeight: 500 }}>Carbs: {fmt1(carbs)}g</span>}
        {typeof fats === 'number' && <span style={{ fontWeight: 500 }}>Fats: {fmt1(fats)}g</span>}
        {typeof calories === 'number' && <span style={{ fontWeight: 500 }}>Calories: {fmt1(calories)}</span>}
      </div>
    ) : null;

  const timeInfo =
    [prepTime, cookTime, servings].some(v => v !== undefined) ? (
      <div style={{
        display: 'flex',
        gap: 16,
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
      }}>
        {typeof prepTime === 'number' && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'linear-gradient(135deg, var(--accent-orange, rgba(255, 152, 0, 0.18)) 0%, var(--accent-orange, rgba(255, 152, 0, 0.15)) 100%)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            color: '#000',
            fontSize: '0.85rem'
          }}>
            🕒 Prep: {fmt1(prepTime)}m
          </span>
        )}
        {typeof cookTime === 'number' && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'linear-gradient(135deg, var(--accent-orange, rgba(255, 152, 0, 0.15)) 0%, var(--accent-orange, rgba(255, 152, 0, 0.12)) 100%)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: 500
          }}>
            🔥 Cook: {fmt1(cookTime)}m
          </span>
        )}
        {typeof servings === 'number' && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'linear-gradient(135deg, var(--accent-green, rgba(16, 185, 129, 0.18)) 0%, var(--accent-green, rgba(16, 185, 129, 0.15)) 100%)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            color: '#000',
            fontSize: '0.85rem'
          }}>
            👥 Serves: {fmt1(servings)}
          </span>
        )}
      </div>
    ) : null;

  const ingredientsPreview =
    ingredients.length > 0 ? (
      <div style={{
        color: 'var(--text-secondary)',
        background: 'linear-gradient(135deg, var(--card-hover-bg, rgba(255,255,255,0.08)) 0%, var(--card-hover-bg, rgba(255,255,255,0.06)) 100%)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--card-border-light, rgba(0,0,0,0.08))',
        fontSize: '0.9rem',
        fontWeight: 500
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Ingredients:</strong> {ingredients.slice(0, 3).join(', ')}
        {ingredients.length > 3 && <span style={{ fontWeight: 500, color: 'var(--accent-green)' }}> +{ingredients.length - 3} more</span>}
      </div>
    ) : null;

  const tagsDisplay =
    tags.length > 0 ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent-green-light, rgba(16, 185, 129, 0.15)) 0%, var(--accent-green, rgba(16, 185, 129, 0.12)) 100%)',
            color: '#000',
            border: '1px solid var(--accent-green-light, rgba(16, 185, 129, 0.25))',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {tag}
          </span>
        ))}
      </div>
    ) : null;

  const instructionsPreview =
    instructions.length > 0 ? (
      <div style={{
        color: 'var(--text-secondary)',
        background: 'linear-gradient(135deg, var(--card-hover-bg, rgba(255,255,255,0.08)) 0%, var(--card-hover-bg, rgba(255,255,255,0.06)) 100%)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--card-border-light, rgba(0,0,0,0.08))',
        fontSize: '0.9rem',
        marginTop: '8px',
        fontWeight: 500
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>Instructions:</strong> {instructions.slice(0, 2).join(' → ')}
        {instructions.length > 2 && <span style={{ fontWeight: 500, color: 'var(--accent-blue)' }}> +{instructions.length - 2} more steps</span>}
      </div>
    ) : null;

  const body = (
    <div style={{ display: 'grid', gap: 8 }}>
      {macroInfo}
      {timeInfo}
      {ingredientsPreview}
      {tagsDisplay}
      {instructionsPreview}
    </div>
  );

  return (
    <>
      <GenericCard
        {...props}
        variant="recipe"
        headerSlot={headerSlot}
        content={body}
        actions={actions}
      />

      {/* 3-dots menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Recipe</ListItemText>
          </MenuItem>
        )}
        {/* Future menu items can be added here */}
      </Menu>
    </>
  );
};

export default RecipeCard;
