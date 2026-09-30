import { useMemo } from 'react';

import { useAppThemeName } from './theme/useAppTheme';
export function useIsDarkMode() {
  const { appThemeName } = useAppThemeName();
  return useMemo(() => appThemeName === 'dark', [appThemeName]);
}
