import React from 'react';
import { View } from 'react-native';

import GnSvg from '~/assets/icons/GN.svg';

const GN_ICON_SCALE = 1.2;

const GnReactionIcon = React.memo(
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
        <GnSvg
          width={size * GN_ICON_SCALE}
          height={size * GN_ICON_SCALE}
          color={color}
          opacity={1}
        />
      </View>
    );
  },
);

GnReactionIcon.displayName = 'GnReactionIcon';

export { GnReactionIcon };
