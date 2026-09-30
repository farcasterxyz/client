import { ArrowDown } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { AnimatedPressable } from '../../../design-system';
import { useSwapTokens } from './SwapTokensProvider';

export function SwapToggle() {
  const t = useTheme();
  const { reverseTokens, isFetching } = useSwapTokens();

  const handlePress = React.useCallback(() => {
    if (isFetching) {
      return;
    }
    reverseTokens();
  }, [reverseTokens, isFetching]);

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, t.wFull, { height: 32 }]}>
      <View style={[t.flex1, t.backgrounds.tertiary, { height: 0.8 }]} />
      <AnimatedPressable onPress={handlePress} disabled={isFetching}>
        <View
          style={[
            t.backgrounds.secondary,
            t.itemsCenter,
            t.justifyCenter,
            t.border,
            t.borders.background,
            { width: 32, height: 32, borderWidth: 2, borderRadius: 8 },
          ]}
        >
          <ArrowDown size={16} strokeWidth={3} color={t.colors.text.primary} />
        </View>
      </AnimatedPressable>
      <View style={[t.flex1, t.backgrounds.tertiary, { height: 0.8 }]} />
    </View>
  );
}
