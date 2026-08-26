import { ApiTokenLink } from 'farcaster-client-data';
import {
  formatAmount,
  formatPrice,
  useGloballyCachedToken,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../../contexts';
import {
  useSafeFocusEffect,
  useTokenBalance,
  useWalletBalancesHidden,
  useWalletFidOverride,
} from '../../../hooks';
import { convertHexToRGBA } from '../../../theme/utils';
import { AnimatedPressable, TextPlaceholder } from '../../design-system';
import { Text2 } from '../../design-system/Text';

function LiveDot() {
  const t = useTheme();
  const opacity = useSharedValue(1);

  useSafeFocusEffect(
    useCallback(() => {
      opacity.value = withRepeat(withTiming(0.8, { duration: 1000 }), -1, true);
      return () => {
        cancelAnimation(opacity);
        opacity.value = 1;
      };
    }, [opacity]),
  );

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <Circle cx="4" cy="4" r="4" fill={t.colors.green450} />
      </Svg>
    </Animated.View>
  );
}

export function TokenBalance({
  fid,
  token: fallbackToken,
  onPress,
  alwaysShow = false,
  disabledPress = false,
  canHideBalance = true,
}: {
  fid?: number;
  token: ApiTokenLink;
  onPress: () => void;
  canHideBalance?: boolean;
  alwaysShow?: boolean;
  disabledPress?: boolean;
}) {
  const t = useTheme();
  const token = useGloballyCachedToken({ fallback: fallbackToken });

  const hidden = '*****';
  const [balancesHidden] = useWalletBalancesHidden();

  const [currentUserFidOverride] = useWalletFidOverride();

  const subjectFid = fid ?? currentUserFidOverride;

  const { data: balanceData, isPending: isBalancePending } = useTokenBalance({
    fid: subjectFid,
    ca: token.ca,
    chain: token.chain,
  });

  const formattedBalance = useMemo(() => {
    if (balancesHidden && canHideBalance) {
      return { quantity: hidden, value: hidden };
    }

    if (!balanceData?.quantity.float) {
      return;
    }

    // Always compute total from price × balance to ensure displayed total
    // matches the displayed price and balance (avoids mismatch from precomputed
    // valueUsd that may use a different price source/rounding).
    // The explicit null/empty/NaN checks are intentional: the Zustand tokenStore
    // merges priceUsd as a number, so a falsy-but-valid 0 must not fall through
    // to the stale balanceData fallback.
    const parsedLivePrice =
      token.priceUsd !== null &&
      token.priceUsd !== undefined &&
      token.priceUsd !== ''
        ? Number(token.priceUsd)
        : NaN;
    const priceUsd = !isNaN(parsedLivePrice)
      ? parsedLivePrice
      : (balanceData.priceUsd ?? 0);
    const valueUsd = priceUsd * balanceData.quantity.float;

    const value = formatPrice(valueUsd, {
      showPositiveSign: false,
    });

    if (value === '$0') {
      return;
    }

    return { quantity: formatAmount(balanceData.quantity.float), value };
  }, [balanceData, balancesHidden, canHideBalance, token.priceUsd]);

  const hasBalance = (() => {
    if (isBalancePending && !balanceData) {
      return undefined;
    }

    if (!formattedBalance) {
      return false;
    }

    return (
      balanceData?.quantity.float !== undefined &&
      balanceData?.quantity.float > 0
    );
  })();

  if (isBalancePending && !alwaysShow) {
    return null;
  }

  if (!hasBalance && !alwaysShow) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp}>
      <AnimatedPressable
        onPress={onPress}
        disabled={disabledPress}
        disableAnimation={disabledPress}
        style={[
          t.flex,
          t.flexCol,
          t.mX3,
          t.border,
          t.borders.secondary,
          { borderRadius: 12 },
        ]}
      >
        <View
          style={[
            t.flexCol,
            {
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              backgroundColor: convertHexToRGBA(
                t.colors.background.secondary,
                0.5,
              ),
            },
          ]}
        >
          <View style={[t.flexRow, t.justifyBetween, t.p3]}>
            <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
              {(() => {
                if (formattedBalance) {
                  return (
                    <View style={[t.flexCol, { gap: 4 }]}>
                      <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                        <LiveDot />
                        <Text2 size="lg" weight="medium" color="primary">
                          {formattedBalance.value}
                        </Text2>
                      </View>
                      <Text2
                        size="sm"
                        weight="medium"
                        color="secondary"
                        numberOfLines={1}
                      >
                        {formattedBalance.quantity} {token.ticker ?? token.name}
                      </Text2>
                    </View>
                  );
                }

                return (
                  <View style={[t.flexCol, { gap: 4 }]}>
                    <TextPlaceholder width={60} size="lg" />
                    <TextPlaceholder width={50} size="sm" />
                  </View>
                );
              })()}
            </View>
          </View>
        </View>
        {!disabledPress && (
          <View
            style={[
              t.flexRow,
              t.pY2,
              t.backgrounds.secondary,
              { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
            ]}
          >
            <AnimatedPressable
              onPress={onPress}
              style={[t.flex1, t.alignCenter, t.itemsCenter, t.justifyCenter]}
            >
              <Text2 size="sm" weight="medium" color="secondary">
                Details
              </Text2>
            </AnimatedPressable>
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}
