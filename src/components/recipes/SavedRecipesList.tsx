import React from 'react';
import { Box } from '@mui/material';
import RecipeCard from './RecipeCard';

type SavedRecipe = {
  id: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients?: string[];
  tags?: string[];
};

type Props = {
  recipes: SavedRecipe[];
  onViewRecipe?: (id: string) => void;
  onAddToMeal?: (id: string) => void;
  onDeleteRecipe?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  favorites?: Set<string>;
};

export const SavedRecipesList: React.FC<Props> = ({
  recipes,
  onViewRecipe,
  onAddToMeal,
  onDeleteRecipe,
  onToggleFavorite,
  favorites = new Set(),
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        alignItems: 'stretch',
      }}
    >
      {recipes.map(r => (
        <Box key={r.id} sx={{ height: '100%' }}>
          <RecipeCard
            recipeName={r.name}
            calories={r.calories}
            protein={r.protein}
            carbs={r.carbs}
            fats={r.fats}
            prepTime={r.prepTime}
            cookTime={r.cookTime}
            servings={r.servings}
            ingredients={r.ingredients}
            tags={r.tags}
            onViewRecipe={onViewRecipe ? () => onViewRecipe(r.id) : undefined}
            onAddToMeal={onAddToMeal ? () => onAddToMeal(r.id) : undefined}
            onDelete={onDeleteRecipe ? () => onDeleteRecipe(r.id) : undefined}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(r.id) : undefined}
            isFavorite={favorites.has(r.id)}
            size="md"
            elevation={1}
            sx={{
              height: '100%',
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default SavedRecipesList;
