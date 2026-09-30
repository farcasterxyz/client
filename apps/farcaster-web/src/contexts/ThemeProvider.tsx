import { createContext } from 'react';

import { type AppThemeName, useAppThemeName } from '~/hooks/theme/useAppTheme';

const ThemeContext = createContext<{
  appThemeName: AppThemeName;
  setAppTheme: (appThemeName: AppThemeName) => void;
}>({
  appThemeName: 'dark',
  setAppTheme: () => {
    throw new Error('setAppTheme must be used within a ThemeProvider');
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useAppThemeName();

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
