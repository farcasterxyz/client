import React, { FC, ReactNode, useEffect } from 'react';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import { useTheme } from '~/contexts/ThemeProvider';

type AndroidBottomBarBackgroundColorHandlerProps = {
  children: ReactNode;
};

const AndroidBottomBarBackgroundColorHandler: FC<
  AndroidBottomBarBackgroundColorHandlerProps
> = ({ children }) => {
  const t = useTheme();

  useEffect(() => {
    changeNavigationBarColor(
      t.colors.bgDefault, // color
      !t.dark, // light
      false, // animated
    );
  }, [t]);

  return <>{children}</>;
};

export { AndroidBottomBarBackgroundColorHandler };
