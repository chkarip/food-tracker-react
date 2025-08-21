# Comprehensive Fitness & Nutrition Tracking Platform Documentation

## Table of Contents

- Project Overview
- Folder Structure  
- Core Modules
- Type System Architecture
- Firebase Collections
- Data Flow
- Development Workflow
- Troubleshooting

## Core Modules

| Module        | Purpose                                    | Key Collections                                    | Primary Components                                                              |
|---------------|--------------------------------------------|----------------------------------------------------|---------------------------------------------------------------------------------|
| Food          | Meal planning, macro tracking, hidden food filtering | dailyPlans, mealPlans, timeslots, foodHistory, foods | TimeslotMealPlanner, FoodSelectorWithFirebase, MacroProgress, SaveLoadPlan, AddFoodManager, RecipeManager |
| Gym           | Workout builder & scheduler                | scheduledWorkouts                                   | WorkoutBuilder, ExerciseCard, SaveWorkoutModal, GymPage                        |
| Activity Grid | Cross-domain streak analytics              | activityHistory, scheduledActivities               | ActivityCubeCard, ActivityTrackerCard, ActivityGrid                            |
| Calendar      | Unified monthly view                       | Aggregates all above                                | Calendar, DayCard, DayModal, DashboardPage                                     |

## Type System Architecture

**Centralized Types**: All food-related interfaces now live in `src/types/food.ts` as single source of truth.

| File Location | Purpose | Exports |
|---------------|---------|---------|
| `types/food.ts` | Central food type definitions | `FoodFormData`, `FirestoreFood`, `LegacyFoodItem`, `FirebaseFoodItem`, `FoodNutrition`, `FoodCost` |
| `services/firebase/nutrition/foodService.ts` | Food CRUD operations only | Functions: `addFood`, `updateFood`, `deleteFood`, `getAllFoods`, `subscribeToFoods` |
| Components | Import types from `types/food.ts` | No local type definitions |

**Benefits**: 
- Single change point for new properties
- Consistent types across entire application
- Easier maintenance and refactoring
- Automatic TypeScript error detection when interfaces change

### Hidden Foods Feature

**Purpose**: Allow foods (like water, supplements) to be excluded from meal planning while remaining in database for administrative purposes.

**Implementation**: 
- `metadata.hidden: boolean` property in food documents
- UI toggle switch in AddFoodManager 
- Filtered out in FoodSelectorWithFirebase component
- Recipes inherit `hidden: false` by default when converted to food items

**Usage**: Mark supplementary or administrative foods as hidden to declutter meal planning interface without losing data.

## Firebase Collections

### 1. dailyPlans (legacy)
Detailed meal plans with completion status. See previous document.

### 2. foods (Updated)
Enhanced food collection with hidden property support:
```javascript
{
  name: "Chicken Breast",
  nutrition: { protein: 23, fats: 1, carbs: 0, calories: 165 },
  cost: { costPerKg: 12.99, unit: "kg" },
  metadata: {
    category: "Protein",
    isUnitFood: false,
    useFixedAmount: false,
    fixedAmount: 100,
    hidden: false,  // New property
    addedAt: Timestamp,
    lastUpdated: Timestamp
  }
}
```

## Component Responsibilities

| Component / Page          | Responsibility                                                              |
|---------------------------|-----------------------------------------------------------------------------|
| TimeslotMealPlanner.tsx   | Dual-timeslot meal planning UI with macro totals.                           |
| FoodSelectorWithFirebase.tsx | Food selection with category grouping and hidden food filtering.         |
| AddFoodManager.tsx        | Admin panel for CRUD operations on food database with hidden toggle.       |
| RecipeManager.tsx         | Recipe creation with automatic food item generation.                        |
| SaveLoadPlan.tsx          | Handles single/multi-day saving of meal plans + scheduled activity syncing. |
| WorkoutBuilder.tsx        | Drag-and-drop exercise builder; saves to scheduledWorkouts.                 |
| DashboardPage.tsx         | Monthly calendar + module stats. Aggregates data from multiple collections. |
| Calendar/DayCard/DayModal | Visualize tasks on calendar, show details on click.                         |

## Data Flow

### Food Data Flow (Updated)

1. **Types Definition**: `types/food.ts` → Single source of truth for all food interfaces
2. **Form Input**: AddFoodManager/RecipeManager → `FoodFormData` with validation
3. **Firestore Storage**: foodService → `FirebaseFoodItem` (with calculated fields like costEfficiency)
4. **Component Usage**: FoodSelector → `FirestoreFood` (simplified for UI)
5. **Legacy Support**: FoodContext → `LegacyFoodItem` (backward compatibility)

**Hidden Food Filtering**: Applied at component level in FoodSelectorWithFirebase to exclude from meal planning

### Data Flow Examples

**Meal Creation**: TimeslotMealPlanner → saveDailyPlan → writes to dailyPlans → saveScheduledActivities → adds meal-6pm/meal-930pm → Calendar displays meal pills.

**Workout Scheduling**: workoutService.saveScheduledWorkout → writes to scheduledWorkouts → addTaskToUnifiedSchedule('gym-workout') → Calendar displays gym pill.

**Food Management**: AddFoodManager → foodService.addFood → writes to foods collection → FoodContext auto-refreshes → Components get updated data

## Index & Rules Configuration

### Firestore Indexes
```
collections:
  - collectionGroup: dailyPlans
    queryScope: COLLECTION
    fields:
      - fieldPath: userId, order: ASCENDING
      - fieldPath: date, order: ASCENDING
      - fieldPath: name, order: ASCENDING
  
  - collectionGroup: scheduledActivities  
    queryScope: COLLECTION
    fields:
      - fieldPath: userId, order: ASCENDING
      - fieldPath: date, order: ASCENDING
      - fieldPath: name, order: ASCENDING

  - collectionGroup: foods
    queryScope: COLLECTION  
    fields:
      - fieldPath: metadata.category, order: ASCENDING
      - fieldPath: name, order: ASCENDING
```

### Security Rules (firestore.rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Development Workflow

### Initial Setup
1. Clone repo & install: `npm install`
2. Set Firebase config in `src/config/firebase.ts`

### Optional Database Seeding
Run scripts to seed Firestore:
```bash
node scripts/create-gym-collections.js  # Seeds workout templates
node scripts/triggerIndexCreation.js    # Triggers missing-index prompts in console
```

### When Adding New Food Properties
1. **Add to `types/food.ts` interfaces only** - Single source of truth
2. **Update AddFoodManager form state** - Add UI controls
3. **Update RecipeManager if needed** - Add default values  
4. **No changes needed in other components** - Automatic propagation via centralized types

### Create missing indexes when console shows link

| Script                                 | Purpose                                                                     |
|----------------------------------------|-----------------------------------------------------------------------------|
| create-gym-collections.ps1 / .sh / .js | Seeds default gym workout templates to Firestore.                           |
| triggerIndexCreation.js                | Runs a dummy query to surface required composite-index links automatically. |
| start-react.bat                        | Convenience script for Windows devs.                                        |

## Troubleshooting

| Issue                       | Cause                            | Fix                                                             |
|-----------------------------|----------------------------------|-----------------------------------------------------------------|
| Query requires an index     | Missing composite index          | Create index via link or firestore.indexes.json                 |
| Scheduled pills not visible | scheduledTasks not passed down   | Ensure generateCalendarDays adds tasks and DayCard renders them |
| Macro totals zero           | Food DB not loaded               | Check getAllFoods and foodDatabase state                        |
| Gym details not loading     | Task saved as gym vs gym-workout | Standardize task names across services and UI                   |
| **TypeScript errors on food interfaces** | **Importing types from wrong location** | **Import from `types/food.ts` not service files** |
| **Missing 'hidden' property errors** | **Old components not updated for new field** | **Add `hidden: false` to food creation objects** |
| **Undefined metadata errors** | **Missing null checks in legacy conversion** | **Use optional chaining `food.metadata?.hidden`** |
| **Recipe food creation fails** | **Missing required properties in FoodFormData** | **Ensure all required fields including `hidden` are provided** |

## Architecture Best Practices

### Type Safety
- **Centralized Types**: All interfaces in `types/` folder prevent duplication
- **Import Consistency**: Always import types from central location, functions from services
- **Optional Chaining**: Use `?.` for optional properties to prevent runtime errors

### Food Data Management  
- **Hidden vs Deleted**: Use `hidden` property instead of deletion to preserve data integrity
- **Recipe Integration**: Recipes automatically create corresponding food items for meal planning
- **Cost Calculations**: Automatic per-kg cost calculations for accurate meal costing

### Error Prevention
- **Validation**: Form validation in AddFoodManager prevents invalid data
- **Null Safety**: Defensive programming with fallback values
- **Type Checking**: TypeScript catches interface mismatches at compile time

## For Additional Help

- Review console logs (prefixed with Firestore DEBUG)
- Ensure indexes are enabled  
- Check that all components import types from `types/food.ts`
- Verify Firebase authentication is working
- Test hidden food filtering in meal planning interface