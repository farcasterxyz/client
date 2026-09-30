import React, { memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts/ThemeContext';
import { Text2 } from '../../../design-system/Text';
import { sizes } from './utils';

const width = sizes.width;
const height = sizes.height + 16;

const NoDataChart = memo(() => {
  const t = useTheme();

  return (
    <View style={[t.absolute, { width, height }]}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text2 color="secondary" size="sm" weight="medium">
          Unable to load data. Please try again
        </Text2>
      </View>
    </View>
  );
});

export { NoDataChart };
