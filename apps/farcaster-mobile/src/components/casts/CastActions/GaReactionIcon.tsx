import React from 'react';
import { View } from 'react-native';

import GaSvg from '~/assets/icons/GA.svg';

const GA_ICON_SCALE = 1.2;

const GaReactionIcon = React.memo(
  ({ color, size = 16 }: { color: string; size?: number }) => {
    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GaSvg
          width={size * GA_ICON_SCALE}
          height={size * GA_ICON_SCALE}
          color={color}
          opacity={1}
        />
      </View>
    );
  },
);

GaReactionIcon.displayName = 'GaReactionIcon';

export { GaReactionIcon };
