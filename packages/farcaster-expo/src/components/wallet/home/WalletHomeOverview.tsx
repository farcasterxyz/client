import React from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { WALLET_NUX_CONFIG } from '../../../constants';
import { useTheme } from '../../../contexts';
import {
  Typography,
  TypographyHeading,
} from '../../design-system/atoms/Typography';
import { WalletHomeActions } from './WalletHomeActions';
import { WalletHomeBalance } from './WalletHomeBalance';
import { WalletHomeBanners } from './WalletHomeBanners';
import { WalletHomeNuxActions } from './WalletHomeNuxActions';

export function WalletHomeOverview({
  scrollOffset,
  headerHeight,
  refreshing,
  progress,
  reviewMode = false,
  belowHeaderSlot,
}: {
  scrollOffset: SharedValue<number>;
  headerHeight: SharedValue<number>;
  refreshing?: boolean;
  progress: SharedValue<number>;
  reviewMode?: boolean;
  belowHeaderSlot?: React.ReactNode;
}) {
  const t = useTheme();
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollOffset.value }],
    };
  });

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (height > 0) {
        headerHeight.value = height;
      }
    },
    [headerHeight],
  );

  const { height: screenHeight } = useWindowDimensions();

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        progress.value,
        [
          WALLET_NUX_CONFIG.PROGRESS_START_POINT,
          WALLET_NUX_CONFIG.PROGRESS_END_POINT,
        ],
        [screenHeight * WALLET_NUX_CONFIG.NUX_HEADER_SCREEN_HEIGHT_RATIO, 0],
      ),
      opacity: interpolate(
        progress.value,
        [
          WALLET_NUX_CONFIG.PROGRESS_START_POINT,
          WALLET_NUX_CONFIG.PROGRESS_END_POINT,
        ],
        [1, 0],
      ),
    };
  }, [progress.value, headerHeight]);

  const actionsAnimatedStyle = useAnimatedStyle(() => {
    const displayed =
      progress.value >= WALLET_NUX_CONFIG.NON_NUX_DISPLAY_PROGRESS_THRESHOLD;
    const interpolatedValue = interpolate(
      progress.value,
      [
        WALLET_NUX_CONFIG.PROGRESS_START_POINT,
        WALLET_NUX_CONFIG.NON_NUX_DISPLAY_PROGRESS_THRESHOLD,
        WALLET_NUX_CONFIG.PROGRESS_END_POINT,
      ],
      [0, 0, 1],
    );
    return {
      opacity: interpolatedValue,
      transform: [{ translateX: 100 * (1 - interpolatedValue) }],
      display: displayed ? 'flex' : 'none',
    };
  }, [progress.value]);

  return (
    <Animated.View
      style={[{ zIndex: 12, gap: 12, paddingBottom: 12 }, style]}
      onLayout={onLayout}
    >
      <View>
        {!reviewMode && (
          <Animated.View
            style={[t.itemsCenter, t.justifyCenter, headerAnimatedStyle]}
          >
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                { width: WALLET_NUX_CONFIG.NUX_TEXT_WIDTH_RATIO },
              ]}
            >
              <TypographyHeading style={[t.mB1]} label="ExtraLarge">
                Discover . Trade. Create
              </TypographyHeading>
              <Typography
                label="Body/Medium"
                color="secondary"
                style={[t.textCenter]}
              >
                Find interesting tokens on Base, Solana and other chains.
              </Typography>
            </View>
          </Animated.View>
        )}
        <WalletHomeBalance isRefreshing={refreshing} />
      </View>
      {!reviewMode && <WalletHomeBanners nuxProgress={progress} />}
      {!reviewMode && <WalletHomeNuxActions progress={progress} />}
      <Animated.View style={reviewMode ? undefined : actionsAnimatedStyle}>
        <WalletHomeActions reviewMode={reviewMode} />
      </Animated.View>
      {belowHeaderSlot}
    </Animated.View>
  );
}

WalletHomeOverview.displayName = 'WalletHomeOverview';
