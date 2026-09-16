import { useCallback, useEffect, useState } from 'react';

export type UserSavedTheme = 'light' | 'dark' | 'system';

const DEFAULT_THEME: UserSavedTheme = 'system';

const STORAGE_KEY = 'user-saved-theme';

const VALID_THEMES = new Set<UserSavedTheme>(['light', 'dark', 'system']);

const isValidTheme = (value: string | null): value is UserSavedTheme =>
  value !== null && VALID_THEMES.has(value as UserSavedTheme);

const getUserSavedTheme = (): UserSavedTheme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isValidTheme(stored) ? stored : DEFAULT_THEME;
};

export function useUserSavedTheme() {
  const [theme, setTheme] = useState<UserSavedTheme>(getUserSavedTheme());

  useEffect(() => {
    const callback = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setTheme(isValidTheme(event.newValue) ? event.newValue : DEFAULT_THEME);
      }
    };
    addEventListener('storage', callback);
    return () => {
      removeEventListener('storage', callback);
    };
  }, []);

  const updateTheme = useCallback(
    (next: UserSavedTheme) => {
      localStorage.setItem(STORAGE_KEY, next);
      setTheme(next);
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: next,
          oldValue: theme,
          storageArea: localStorage,
          url: window.location.href,
        }),
      );
    },
    [theme],
  );

  return { userSavedTheme: theme, setUserSavedTheme: updateTheme };
}
