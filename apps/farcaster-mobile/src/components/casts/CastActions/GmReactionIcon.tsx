import React from 'react';
import { View } from 'react-native';

import GmSvg from '~/assets/icons/GM.svg';

const GM_ICON_SCALE = 1.2;

const GmReactionIcon = React.memo(
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
        <GmSvg
          width={size * GM_ICON_SCALE}
          height={size * GM_ICON_SCALE}
          color={color}
          opacity={1}
        />
      </View>
    );
  },
);

GmReactionIcon.displayName = 'GmReactionIcon';

export { GmReactionIcon };
