import { Octicons } from '@expo/vector-icons';
import { formatViewCount } from 'farcaster-client-hooks';
import React, { FC } from 'react';
import { View } from 'react-native';

import { minCastActionWidth } from '~/components/casts/CastActions/shared';
import { CastActionsBarProps } from '~/components/casts/CastActions/types';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

const Views: FC<CastActionsBarProps> = ({ cast, hideCounts }) => {
  const t = useTheme();

  if (hideCounts || cast.viewCount === undefined) {
    return null;
  }

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        {
          minWidth: minCastActionWidth,
        },
      ]}
    >
      <Octicons
        name="graph"
        size={14}
        style={[t.texts.tertiary, { marginRight: 6 }]}
      />
      <Text style={[t.texts.tertiary, t.textSm, t.fontNormal]}>
        {formatViewCount(cast.viewCount)}
      </Text>
    </View>
  );
};

Views.displayName = 'Views';

export { Views };
