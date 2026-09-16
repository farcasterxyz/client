import { useCallback, useEffect, useState } from 'react';

import { type UserSavedTheme, useUserSavedTheme } from './useUserSavedTheme';

export type AppThemeName = 'light' | 'dark';

const DEFAULT_THEME = 'dark';

export function useAppThemeName() {
  const { userSavedTheme, setUserSavedTheme } = useUserSavedTheme();
  const [appThemeName, setAppThemeName] = useState<AppThemeName>(DEFAULT_THEME);

  const setAppTheme = useCallback(
    (next: UserSavedTheme) => setUserSavedTheme(next),
    [setUserSavedTheme],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const effective: AppThemeName =
        (userSavedTheme ?? DEFAULT_THEME) === 'system'
          ? mql.matches
            ? 'dark'
            : 'light'
          : (userSavedTheme as AppThemeName);

      setAppThemeName(effective);

      const root = document.documentElement;
      root.classList.toggle('dark', effective === 'dark');
      root.classList.toggle('light', effective === 'light');
      root.setAttribute('data-theme', userSavedTheme ?? DEFAULT_THEME);
    };

    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [userSavedTheme, setAppThemeName]);

  return { appThemeName, setAppTheme };
}
