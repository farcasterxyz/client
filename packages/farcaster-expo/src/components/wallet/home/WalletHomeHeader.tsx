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
  // Same account-wide balance `useSecondaryWalletsVisible` reads (React Query
  // dedupes the shared key); we need its loading state, which that hook does
  // not expose.
  const {
    totalBalance: totalAccountBalance,
    isError: isAccountBalanceError,
    isFetchedAfterMount: isAccountBalanceFetchedThisSession,
  } = useWalletBalances(undefined, { useActiveWallet: false });

  React.useEffect(() => {
    // `useSecondaryWalletsVisible` treats a not-yet-loaded balance as 0, so
    // healing before balances resolve would rewrite the user's stored secondary
    // selection to `primary`. `isPending`/cached-data checks are not enough:
    // mobile persists `walletPositions`, so a hydrated cached zero balance has
    // `isPending === false` and would still trigger the wipe on cold start.
    // Only heal once this session has actually fetched the balance.
    // (`activeNamespace` is already gated on a loaded wallet list inside
    // useActiveWallet, so the feature-flag race is covered there.)
    //
    // `isFetchedAfterMount` also flips true when the fetch *fails* (query-core
    // counts errorUpdateCount too), and React Query keeps previously cached
    // data on error. So a failed refetch over a hydrated $0 balance would
    // still read as "fetched, balance 0" and wipe the selection on stale
    // data. Require a *successful* fetch this session: not in error state,
    // and an actual balance value present.
    //
    // walletPositions has a 30s staleTime: re-entering this tab within 30s
    // skips the refetch, `isFetchedAfterMount` stays false, and this heal
    // simply does not run that visit. That fails safe (nothing is written).
    if (
      !isAccountBalanceFetchedThisSession ||
      isAccountBalanceError ||
      totalAccountBalance === undefined
    ) {
      return;
    }
    if (!secondaryWalletsVisible && activeNamespace === 'secondary') {
      selectPrimaryWallet();
    }
  }, [
    isAccountBalanceFetchedThisSession,
    isAccountBalanceError,
    totalAccountBalance,
    secondaryWalletsVisible,
    activeNamespace,
    selectPrimaryWallet,
  ]);

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
