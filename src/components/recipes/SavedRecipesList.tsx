import React, { useState, useMemo } from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    
    const term = searchTerm.toLowerCase();
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(term) ||
      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(term))) ||
      (recipe.ingredients && recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(term)))
    );
  }, [recipes, searchTerm]);

  return (
    <Box>
      {/* Search Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search recipes by name, tags, or ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--text-secondary)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--surface-bg)',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'var(--border-color)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--accent-green)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--accent-green)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'var(--text-primary)',
              '&::placeholder': {
                color: 'var(--text-secondary)',
                opacity: 0.7,
              },
            },
          }}
        />
      </Box>

      {/* Recipe Grid */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {filteredRecipes.map(r => (
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

      {/* No results message */}
      {filteredRecipes.length === 0 && searchTerm.trim() && (
        <Box sx={{ 
          textAlign: 'center', 
          mt: 4, 
          p: 4,
          backgroundColor: 'var(--surface-bg)',
          borderRadius: 2,
          border: '1px solid var(--border-color)'
        }}>
          <SearchIcon sx={{ 
            fontSize: 48, 
            color: 'var(--text-secondary)', 
            mb: 2,
            opacity: 0.5
          }} />
          <Box sx={{ color: 'var(--text-secondary)' }}>
            No recipes found matching "{searchTerm}"
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SavedRecipesList;
