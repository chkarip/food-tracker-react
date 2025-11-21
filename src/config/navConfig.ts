import {
  Dashboard as DashboardIcon,
  Restaurant as FoodIcon,
  ShoppingCart as ShoppingIcon,
  FitnessCenter as GymIcon,
  AccountBalance as FinanceIcon,
  Person as ProfileIcon,
  LocalDrink as WaterIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { getLastUsedTab } from '../utils/lastTab';

export type MuiIconType = OverridableComponent<SvgIconTypeMap<{}, "svg">>;

export interface NavItem {
  key: string;
  label: string;
  icon?: MuiIconType;
  path: string;
  permission?: () => boolean;
}

export const navConfig: NavItem[] = [
  {
    key: 'food',
    label: 'Food',
    icon: FoodIcon,
    path: '/food',
    permission: () => true,
  },
  {
    key: 'shopping',
    label: 'Shopping List',
    icon: ShoppingIcon,
    path: '/shopping',
    permission: () => true,
  },
  {
    key: 'gym',
    label: 'Gym',
    icon: GymIcon,
    path: '/gym',
    permission: () => true,
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: FinanceIcon,
    path: '/finance',
    permission: () => true,
  },
  {
    key: 'water',
    label: 'Water',
    icon: WaterIcon,
    path: '/water',
    permission: () => true,
  },
  {
    key: 'about',
    label: 'About',
    icon: InfoIcon,
    path: '/about',
    permission: () => true,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: ProfileIcon,
    path: '/profile',
    permission: () => true,
  },
];

export interface LocalNavItem {
  key: string;
  label: string;
  path: string;
  default?: boolean;
  rememberLastTab?: boolean;
}

export interface ModuleConfig {
  key: string;
  locals: LocalNavItem[];
}

export const moduleConfigs: Record<string, ModuleConfig> = {
  food: {
    key: 'food',
    locals: [
      {
        key: 'plan',
        label: 'Meal Plan',
        path: '/food/plan',
        default: true,
        rememberLastTab: true,
      },
      {
        key: 'track',
        label: 'Food Track',
        path: '/food/track',
        rememberLastTab: true,
      },
      {
        key: 'inventory',
        label: 'Inventory',
        path: '/food/inventory',
        rememberLastTab: true,
      },
      {
        key: 'recipes',
        label: 'Recipes',
        path: '/food/recipes',
        rememberLastTab: true,
      },
      {
        key: 'manage',
        label: 'Manage Foods',
        path: '/food/manage',
        rememberLastTab: true,
      },
    ],
  },
  gym: {
    key: 'gym',
    locals: [
      {
        key: 'workouts',
        label: 'Workouts',
        path: '/gym/workouts',
        default: true,
        rememberLastTab: true,
      },
      {
        key: 'schedule',
        label: 'Schedule',
        path: '/gym/schedule',
        rememberLastTab: true,
      },
      {
        key: 'exercises',
        label: 'Exercise Library',
        path: '/gym/exercises',
        rememberLastTab: true,
      },
      {
        key: 'progress',
        label: 'Progress',
        path: '/gym/progress',
        rememberLastTab: true,
      },
    ],
  },
  finance: {
    key: 'finance',
    locals: [
      {
        key: 'overview',
        label: 'Overview',
        path: '/finance/overview',
        default: true,
        rememberLastTab: true,
      },
      {
        key: 'budget',
        label: 'Budget',
        path: '/finance/budget',
        rememberLastTab: true,
      },
      {
        key: 'expenses',
        label: 'Expenses',
        path: '/finance/expenses',
        rememberLastTab: true,
      },
      {
        key: 'reports',
        label: 'Reports',
        path: '/finance/reports',
        rememberLastTab: true,
      },
    ],
  },
  shopping: {
    key: 'shopping',
    locals: [
      {
        key: 'list',
        label: 'Shopping List',
        path: '/shopping/list',
        default: true,
        rememberLastTab: true,
      },
      {
        key: 'recipes',
        label: 'Recipe Shopping',
        path: '/shopping/recipes',
        rememberLastTab: true,
      },
      {
        key: 'history',
        label: 'Purchase History',
        path: '/shopping/history',
        rememberLastTab: true,
      },
    ],
  },
};

export const getLocalItems = (moduleKey: string): LocalNavItem[] => {
  return moduleConfigs[moduleKey]?.locals || [];
};

export const getDefaultLocalPath = (moduleKey: string): string => {
  const locals = getLocalItems(moduleKey);
  if (locals.length === 0) return '';

  // Always use the default item or first item (ignore remembered tab)
  const defaultItem = locals.find(item => item.default) || locals[0];
  return defaultItem?.path || '';
};

export const getCurrentModule = (pathname: string): string => {
  // Check for exact matches first
  const exactMatch = navConfig.find(item => item.path === pathname);
  if (exactMatch) return exactMatch.key;

  // Check for module prefixes (e.g., /food/* should return 'food')
  for (const item of navConfig) {
    if (item.path !== '/' && pathname.startsWith(item.path)) {
      return item.key;
    }
  }

  return 'food';
};
