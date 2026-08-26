import { Search } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../contexts';
import {
  useActiveWallet,
  useCurrentUser,
  useSecondaryWalletsVisible,
  useWalletBalances,
  useWalletBalancesHidden,
} from '../../../hooks';
import { Avatar } from '../../Avatar';
import { AnimatedPressable, Text2 } from '../../design-system';
import { PrivateWalletsPanel } from '../private-wallets';

export function WalletHomeHeader({
  scrollOffset,
  onAvatarPress,
  onSearchPress,
}: {
  scrollOffset?: SharedValue<number>;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
}) {
  const t = useTheme();
  const user = useCurrentUser();
  const secondaryWalletsVisible = useSecondaryWalletsVisible();
  const { totalBalance } = useWalletBalances();
  const [balancesHidden] = useWalletBalancesHidden();
  const { activeNamespace, selectPrimaryWallet } = useActiveWallet();

  React.useEffect(() => {
    if (!secondaryWalletsVisible && activeNamespace === 'secondary') {
      selectPrimaryWallet();
    }
  }, [secondaryWalletsVisible, activeNamespace, selectPrimaryWallet]);

  const progress = useSharedValue(0);
  const balanceStyle = useAnimatedStyle(() => {
    if (!scrollOffset) {
      return {
        opacity: 0,
      };
    }

    const offset = Platform.OS === 'web' ? 1 : 50;

    if (scrollOffset.value >= offset) {
      progress.value = withTiming(1, { duration: 150 });
    } else if (scrollOffset.value < offset) {
      progress.value = withTiming(0, { duration: 150 });
    }
    return {
      opacity: progress.value,
    };
  });

  const balanceText = React.useMemo(() => {
    if (!totalBalance) {
      return;
    }

    if (balancesHidden) {
      return '*****';
    }

    return `$${totalBalance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [balancesHidden, totalBalance]);

  const topBarHeight = 48;

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.pX4,
        t.pB2,
        t.wFull,
        { height: topBarHeight, paddingTop: 6 },
      ]}
    >
      <View
        style={[
          t.absolute,
          t.left0,
          t.pL4,
          { height: topBarHeight },
          t.justifyCenter,
        ]}
      >
        <AnimatedPressable onPress={onAvatarPress}>
          <Avatar pfpUrl={user?.pfp?.url} diameter={30} border={false} />
        </AnimatedPressable>
      </View>
      {secondaryWalletsVisible ? (
        <PrivateWalletsPanel />
      ) : (
        <Animated.View style={[balanceStyle]} pointerEvents="box-none">
          {balanceText && (
            <Text2 size="lg" weight="semibold">
              {balanceText}
            </Text2>
          )}
        </Animated.View>
      )}

      {onSearchPress && (
        <View
          style={[
            t.absolute,
            t.right0,
            t.pR4,
            { height: topBarHeight },
            t.justifyCenter,
          ]}
        >
          <AnimatedPressable
            style={[t.itemsCenter, t.justifyCenter, { width: 36, height: 36 }]}
            onPress={onSearchPress}
          >
            <Search color={t.colors.text.primary} size={22} />
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}
