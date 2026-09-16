import { formatPrice } from 'farcaster-client-hooks';
import { Clock, Loader, Triangle, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../contexts';
import { useWalletBalances, useWalletBalancesHidden } from '../../../hooks';
import { useSafeFocusEffect } from '../../../hooks/useSafeFocusEffect';
import {
  AnimatedBalanceDisplay,
  AnimatedPressable,
  Text2,
  TextPlaceholder,
} from '../../design-system';

export function WalletHomeBalance({
  fid,
  size = '5xl',
  shouldHideBalances = true,
  isRefreshing,
}: {
  fid?: number;
  size?: '2xl' | '3xl' | '5xl';
  shouldHideBalances?: boolean;
  isRefreshing?: boolean;
}) {
  const t = useTheme();
  const {
    totalBalance,
    percentChange1d,
    amountChange1d,
    isPending,
    refetch,
    freshness,
  } = useWalletBalances(fid);

  const [balancesHidden, setBalancesHidden] = useWalletBalancesHidden();
  const hideBalance = shouldHideBalances && balancesHidden;

  const toggleBalancesHidden = React.useCallback(() => {
    if (!shouldHideBalances) return;

    setBalancesHidden((prev) => !prev);
  }, [shouldHideBalances, setBalancesHidden]);

  useSafeFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const change = React.useMemo(() => {
    if (!percentChange1d || !amountChange1d || balancesHidden) {
      return;
    }

    if (percentChange1d === 0) {
      return {
        amountLabel: '-$0.00',
        perecentLabel: '0.00%',
        color: t.colors.text.tertiary,
        bgColor: t.colors.background.secondary,
      };
    }

    const positive = percentChange1d > 0;
    const color = positive ? t.colors.green450 : t.colors.red450;
    return {
      icon: positive ? (
        <Triangle size={6} fill={color} color={color} />
      ) : (
        // Wrapping in a View to apply rotation - transforming the Triangle directly causes it to disappear on Web
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <Triangle size={6} fill={color} color={color} />
        </View>
      ),
      amountLabel: formatPrice(amountChange1d),
      perecentLabel: `${Math.abs(percentChange1d).toFixed(2)}%`,
      color: color,
      backgroundColor: positive
        ? t.colors.background.success
        : t.colors.background.danger,
    };
  }, [t, percentChange1d, amountChange1d, balancesHidden]);

  const content = React.useMemo(() => {
    return (
      <View style={[t.pX3]}>
        {hideBalance ? (
          <Text2
            size={size}
            weight="semibold"
            color="tertiary"
            style={{ paddingTop: 14 }}
          >
            *****
          </Text2>
        ) : isPending ? (
          <TextPlaceholder size={size} width={50} style={[t.mT2]} />
        ) : totalBalance === undefined ? (
          <Text2
            size={size}
            weight="semibold"
            color="tertiary"
            style={{ paddingTop: 14 }}
          >
            —
          </Text2>
        ) : (
          <AnimatedBalanceDisplay size={size} amount={totalBalance} />
        )}
        {isRefreshing ? (
          <RefreshingBalance />
        ) : (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 size="sm" weight="semibold" style={{ color: change?.color }}>
              {change?.amountLabel}
            </Text2>
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.roundedLg,
                t.pX1,
                {
                  gap: 4,
                  paddingVertical: 2,
                  backgroundColor: change?.backgroundColor,
                },
              ]}
            >
              {change?.icon}
              <Text2
                size="xs"
                weight="semibold"
                style={{ color: change?.color }}
              >
                {change?.perecentLabel}
              </Text2>
            </View>
          </View>
        )}
        {freshness && !freshness.isFresh && (
          <View
            style={[
              t.flexRow,
              t.border,
              {
                backgroundColor: t.dark
                  ? t.colors.background.secondary
                  : t.colors.background.warning,
                borderColor: t.dark
                  ? t.colors.text.warning + '33'
                  : t.colors.text.warning + '4d',
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
                gap: 12,
              },
            ]}
          >
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                t.roundedFull,
                {
                  width: 36,
                  height: 36,
                  backgroundColor: t.dark
                    ? t.colors.background.warning
                    : t.colors.background.default,
                },
              ]}
            >
              <TriangleAlert size={18} color={t.colors.text.warning} />
            </View>
            <View style={[t.flex1, { gap: 4 }]}>
              <Text2 weight="semibold" style={{ color: t.colors.text.warning }}>
                Balance data temporarily unavailable
              </Text2>
              <Text2 size="sm" color="secondary">
                We are currently experiencing a provider outage. Displayed
                balances may be stale or temporarily unavailable.
              </Text2>
              <View
                style={[t.flexRow, t.itemsCenter, { gap: 6, marginTop: 4 }]}
              >
                <Clock size={12} color={t.colors.text.tertiary} />
                <Text2 size="xs" color="tertiary" weight="medium">
                  Stale data
                </Text2>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }, [
    hideBalance,
    size,
    totalBalance,
    isPending,
    isRefreshing,
    change,
    t,
    freshness,
  ]);

  if (shouldHideBalances) {
    return (
      <AnimatedPressable onPress={toggleBalancesHidden}>
        {content}
      </AnimatedPressable>
    );
  }

  return <View>{content}</View>;
}

function RefreshingBalance() {
  const t = useTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(rotation);
      rotation.value = 0;
    };
  }, [rotation]);

  const rotationAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <Animated.View style={rotationAnimatedStyle}>
        <Loader size={14} color={t.colors.text.brand} />
      </Animated.View>
      <Text2 size="sm" weight="medium" color="tertiary">
        Refreshing...
      </Text2>
    </View>
  );
}
