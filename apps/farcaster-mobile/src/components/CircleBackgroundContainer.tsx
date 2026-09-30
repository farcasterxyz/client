import React, { FC, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

interface CircleBackgroundContainerProps {
  style: StyleProp<ViewStyle>;
  size: number;
  children: ReactNode;
}

const CircleBackgroundContainer: FC<CircleBackgroundContainerProps> = ({
  style,
  size,
  children,
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        t.roundedFull,
        t.flexCol,
        t.itemsCenter,
        t.justifyCenter,
        { width: size, height: size },
        style,
      ]}
    >
      {children}
    </View>
  );
};
CircleBackgroundContainer.displayName = 'CircleBackgroundContainer';

export { CircleBackgroundContainer };
