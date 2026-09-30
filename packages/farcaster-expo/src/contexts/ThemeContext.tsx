import * as React from 'react';

import { getTheme } from '../theme';

type ThemeContextType = ReturnType<typeof getTheme> & {
  setV2?: (v2: boolean) => void;
};

const ThemeContext = React.createContext<ThemeContextType>(getTheme('light'));

const useTheme = () => React.useContext(ThemeContext);

export { ThemeContext, useTheme };
