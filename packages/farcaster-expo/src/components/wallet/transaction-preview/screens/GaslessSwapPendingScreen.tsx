import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { Text2 } from '../../../design-system';
import { ActivitySpinner } from '../../ActivitySpinner';

/**
 * Screen component for displaying a pending state while executing gasless swap
 */
export function GaslessSwapPendingScreen({
  title = 'Sending',
}: {
  title?: string | null;
}) {
  const t = useTheme();

  return (
    <View>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX4,
          t.pY2,
        ]}
      >
        <Text2 style={[t.textLg, t.fontBold]}>{title}</Text2>
      </View>
      <View style={[t.flex, t.flexCol, t.p4, { gap: 16 }]}>
        <View
          style={[
            t.flex,
            t.flexCol,
            t.itemsCenter,
            t.justifyCenter,
            { gap: 16 },
          ]}
        >
          <ActivitySpinner />
          <Text2 size="base" color="primary" align="center">
            Do not close this screen. This may take a few seconds.
          </Text2>
        </View>
      </View>
    </View>
  );
}
