import { useCallback } from 'react';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { WALLET_NUX_CONFIG } from '../../../constants';
import { useSharedNavigationContext, useTheme } from '../../../contexts';
import { AtomsButton } from '../../design-system/atoms';

type WalletHomeNuxActionsProps = {
  progress: SharedValue<number>;
};

export function WalletHomeNuxActions({ progress }: WalletHomeNuxActionsProps) {
  const t = useTheme();
  const { push } = useSharedNavigationContext();

  const onDepositPress = useCallback(() => {
    push({ path: 'WalletReceive' });
  }, [push]);

  const onExploreTokensPress = useCallback(() => {
    push({
      path: 'WalletExplore',
      params: { prefilledQuery: '' },
    });
  }, [push]);

  const animatedStyle = useAnimatedStyle(() => {
    const displayed =
      progress.value < WALLET_NUX_CONFIG.NON_NUX_DISPLAY_PROGRESS_THRESHOLD;
    return {
      opacity: interpolate(
        progress.value,
        [
          WALLET_NUX_CONFIG.PROGRESS_START_POINT,
          WALLET_NUX_CONFIG.PROGRESS_MID_POINT,
        ],
        [1, 0],
      ),
      display: displayed ? 'flex' : 'none',
    };
  }, [progress]);

  return (
    <Animated.View style={[t.flexGrow, t.gap2, t.p3, animatedStyle]}>
      <AtomsButton
        size="m"
        onPress={onDepositPress}
        Icon={({ size, color }) => (
          <Svg width={size} height={size} viewBox="0 0 21 20" fill="none">
            <Path
              d="M10.5 18.3334C15.1023 18.3334 18.8333 14.6025 18.8333 10.0001C18.8333 5.39771 15.1023 1.66675 10.5 1.66675C5.89759 1.66675 2.16663 5.39771 2.16663 10.0001C2.16663 14.6025 5.89759 18.3334 10.5 18.3334Z"
              fill={color}
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M10.5 6.66675V13.3334"
              stroke={t.colors.background.brand}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M7.16663 10L10.5 13.3333L13.8333 10"
              stroke={t.colors.background.brand}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      >
        Deposit
      </AtomsButton>
      <AtomsButton
        size="m"
        hierarchy="secondary"
        onPress={onExploreTokensPress}
      >
        Explore tokens
      </AtomsButton>
    </Animated.View>
  );
}
