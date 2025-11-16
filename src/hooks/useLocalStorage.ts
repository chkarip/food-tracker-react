import { useState, useEffect } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
};

interface ExpiryOptions {
  expiresOnNewDay?: boolean;
  expiresInHours?: number;
}

interface StoredValueWithExpiry<T> {
  value: T;
  expiry: number;
}

export const useLocalStorageWithExpiry = <T>(
  key: string,
  initialValue: T,
  options: ExpiryOptions = {}
) => {
  const getExpiryTime = () => {
    const now = new Date();
    if (options.expiresOnNewDay) {
      // Set expiry to end of current day
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.getTime();
    } else if (options.expiresInHours) {
      return now.getTime() + (options.expiresInHours * 60 * 60 * 1000);
    }
    return null;
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed: StoredValueWithExpiry<T> = JSON.parse(item);

      // Check if expired
      if (parsed.expiry && Date.now() > parsed.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return parsed.value;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const expiryTime = getExpiryTime();

      const dataToStore: StoredValueWithExpiry<T> = {
        value: valueToStore,
        expiry: expiryTime || 0
      };

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Check for expiry on component mount and periodically
  useEffect(() => {
    const checkExpiry = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (!item) return;

        const parsed: StoredValueWithExpiry<T> = JSON.parse(item);
        if (parsed.expiry && Date.now() > parsed.expiry) {
          window.localStorage.removeItem(key);
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.warn(`Error checking expiry for localStorage key "${key}":`, error);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute for daily expiry
    const interval = setInterval(checkExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [key, initialValue]);

  return [storedValue, setValue] as const;
};