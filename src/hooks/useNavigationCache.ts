import { useLocalStorage } from './useLocalStorage';

export const useNavigationCache = () => {
  const [tabPreferences, setTabPreferences] = useLocalStorage<Record<string, string>>('navigation-tabs', {});
  const [moduleHistory, setModuleHistory] = useLocalStorage<string[]>('module-history', []);

  const getLastTab = (module: string) => {
    return tabPreferences[module] || 'overview';
  };

  const setLastTab = (module: string, tab: string) => {
    setTabPreferences(prev => ({ ...prev, [module]: tab }));
  };

  const addToHistory = (module: string) => {
    setModuleHistory(prev => {
      const newHistory = [module, ...prev.filter(m => m !== module)];
      return newHistory.slice(0, 5); // Keep last 5 modules
    });
  };

  return { getLastTab, setLastTab, addToHistory, moduleHistory };
};;