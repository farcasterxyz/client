import { Platform } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

const useDefaultToastProviderProps = () => {
  const t = useTheme();

  return {
    duration: 2500,
    normalColor: t.colors.background.dark,
    successColor: t.colors.background.dark,
    dangerColor: t.colors.background.dark,
    warningColor: t.colors.background.dark,
    offsetTop: Platform.OS === 'web' ? 20 : 50,
    offsetBottom: 98,
    placement: 'bottom',
    style: {
      borderRadius: t.borderRadiuses.$12,
    },
  } as const;
};

export { useDefaultToastProviderProps };
