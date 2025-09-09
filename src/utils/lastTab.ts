/**
 * lastTab.ts - Utility for managing last-used local navigation tabs
 *
 * Provides functions to get and set the last-used tab for each module
 * in localStorage with namespaced keys for cross-module isolation.
 */

const STORAGE_PREFIX = 'app:lastTab:';

/**
 * Get the last-used local tab path for a module
 * @param moduleKey - The module key (e.g., 'food', 'gym')
 * @returns The last-used path or null if not set
 */
export const getLastUsedTab = (moduleKey: string): string | null => {
  // Guard against SSR
  if (typeof window === 'undefined') return null;

  try {
    const key = `${STORAGE_PREFIX}${moduleKey}`;
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to get last used tab from localStorage:', error);
    return null;
  }
};

/**
 * Set the last-used local tab path for a module
 * @param moduleKey - The module key (e.g., 'food', 'gym')
 * @param path - The tab path to remember
 */
export const setLastUsedTab = (moduleKey: string, path: string): void => {
  // Guard against SSR
  if (typeof window === 'undefined') return;

  try {
    const key = `${STORAGE_PREFIX}${moduleKey}`;
    localStorage.setItem(key, path);
  } catch (error) {
    console.warn('Failed to set last used tab in localStorage:', error);
  }
};

/**
 * Clear the last-used tab for a module
 * @param moduleKey - The module key (e.g., 'food', 'gym')
 */
export const clearLastUsedTab = (moduleKey: string): void => {
  // Guard against SSR
  if (typeof window === 'undefined') return;

  try {
    const key = `${STORAGE_PREFIX}${moduleKey}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear last used tab from localStorage:', error);
  }
};
