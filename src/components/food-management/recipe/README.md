# Recipe Manager Refactoring

## 📁 New Structure

```
src/components/food-management/recipe/
├── hooks/
│   ├── useRecipes.ts              # Firestore CRUD operations
│   ├── useRecipeCalculations.ts   # Nutrition & cost calculations
│   ├── useRecipeForm.ts           # Form state management
│   └── index.ts                   # Barrel exports
├── RecipeManagerRefactored.tsx     # New orchestration layer (400 lines)
└── README.md                       # This file
```

## 🎯 Refactoring Goals Achieved

### Before (RecipeManager.tsx - 1083 lines)
- ❌ Mixed UI, business logic, and data operations
- ❌ Hard to test individual pieces
- ❌ Difficult to reuse logic
- ❌ Complex component with multiple responsibilities

### After (Separated Concerns)
- ✅ **useRecipes**: Isolated Firestore operations (200 lines)
- ✅ **useRecipeCalculations**: Pure calculation logic (150 lines)
- ✅ **useRecipeForm**: Form state management (200 lines)
- ✅ **RecipeManagerRefactored**: UI orchestration only (400 lines)
- ✅ Each piece is testable and reusable

## 🔧 Hook Responsibilities

### 1. useRecipes.ts
**Purpose**: Database operations
- Load all recipes from Firestore
- Create/update recipes
- Delete recipes
- Create corresponding food items

**API**:
```typescript
const { recipes, loading, error, loadRecipes, saveRecipe, deleteRecipe } = useRecipes();
```

### 2. useRecipeCalculations.ts
**Purpose**: All nutrition and cost math
- Calculate ingredient nutrition
- Calculate ingredient costs
- Calculate recipe totals
- Calculate per-serving values
- Handle unit vs weight foods

**API**:
```typescript
const {
  foodDatabase,
  availableFoods,
  calculateIngredientNutrition,
  calculateIngredientCost,
  calculateTotalNutrition,
  calculateTotalCost,
  createIngredient,
  updateIngredientCalculations
} = useRecipeCalculations();
```

### 3. useRecipeForm.ts
**Purpose**: Form state and validation
- Manage form data state
- Handle ingredient CRUD
- Handle instruction CRUD
- Handle tag management
- Form validation
- Convert form to Recipe object

**API**:
```typescript
const {
  formData,
  editingRecipe,
  totals,
  resetForm,
  loadRecipeForEdit,
  updateField,
  addIngredient,
  updateIngredient,
  removeIngredient,
  validate,
  toRecipe
} = useRecipeForm();
```

## 📊 Benefits

### 1. Separation of Concerns
- **Data Layer** (useRecipes): Knows about Firestore, doesn't know about UI
- **Business Logic** (useRecipeCalculations): Pure functions, no side effects
- **State Management** (useRecipeForm): Manages form state, delegates calculations
- **Presentation** (RecipeManagerRefactored): UI only, delegates everything else

### 2. Testability
Each hook can be tested independently:
```typescript
// Test calculations without UI or database
const { calculateTotalNutrition } = useRecipeCalculations();
const result = calculateTotalNutrition(mockIngredients);
expect(result.protein).toBe(100);
```

### 3. Reusability
Hooks can be used in other components:
```typescript
// Use recipe calculations in meal planning
const { calculateTotalCost } = useRecipeCalculations();

// Use recipe form in a different UI (mobile, wizard, etc.)
const { formData, updateField } = useRecipeForm();
```

### 4. Maintainability
- Clear boundaries between layers
- Easy to find and fix bugs
- Simple to add new features
- Each file has single responsibility

## 🚀 Migration Path

### Option 1: Gradual Migration
Keep both versions temporarily:
- `RecipeManager.tsx` - Original (deprecated)
- `RecipeManagerRefactored.tsx` - New version
- Test new version thoroughly
- Switch routing to new version
- Delete old version

### Option 2: Direct Replacement
```bash
# Backup original
mv RecipeManager.tsx RecipeManager.old.tsx

# Rename new version
mv RecipeManagerRefactored.tsx RecipeManager.tsx

# Test and verify
npm start

# If good, delete backup
rm RecipeManager.old.tsx
```

## 🧪 Testing Checklist

- [ ] Create new recipe
- [ ] Edit existing recipe
- [ ] Delete recipe
- [ ] Add/remove ingredients
- [ ] Update ingredient amounts
- [ ] Nutrition calculations correct
- [ ] Cost calculations correct
- [ ] Fixed serving toggle works
- [ ] Tags management works
- [ ] Instructions management works
- [ ] Recipe appears in foods collection
- [ ] Validation works correctly

## 📈 Future Improvements

### Additional Components (If Needed)
```
recipe/
├── components/
│   ├── RecipeList.tsx          # Grid of recipe cards
│   ├── RecipeForm.tsx          # Recipe form dialog
│   ├── IngredientEditor.tsx    # Ingredient list management
│   └── RecipeCard.tsx          # Individual recipe card
```

### Additional Hooks
```
hooks/
├── useRecipeSearch.ts          # Search and filter recipes
├── useRecipeTags.ts            # Tag management across recipes
└── useRecipeImport.ts          # Import from external sources
```

## 💡 Key Learnings

1. **Custom hooks are powerful** for extracting business logic
2. **Single Responsibility Principle** makes code more maintainable
3. **Composition over inheritance** provides flexibility
4. **Pure functions** (calculations) are easiest to test
5. **Clear interfaces** between layers prevent coupling

## 📝 Notes

- Original file kept for reference: `RecipeManager.tsx`
- New file is drop-in replacement: `RecipeManagerRefactored.tsx`
- All hooks use TypeScript for type safety
- Hooks use useCallback to prevent unnecessary re-renders
- Form validation is centralized in useRecipeForm
