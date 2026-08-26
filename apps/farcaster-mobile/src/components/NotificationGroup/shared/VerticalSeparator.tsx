import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

const VerticalSeparator: FC = memo(() => {
  const t = useTheme();

  return (
    <View
      style={[t.mL3, t.borderLHairline, t.borderDefault, t.wPx, t.h6]}
    ></View>
  );
});

VerticalSeparator.displayName = 'VerticalSeparator';

export { VerticalSeparator };
