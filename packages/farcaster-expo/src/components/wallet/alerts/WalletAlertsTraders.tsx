import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  formatTimeAgoSuffix,
  useCreateTraderSubscription,
  useDebouncedValue,
  useDeleteTraderSubscription,
  useNonSuspenseFollowingWithRefreshOnMount,
  useNonSuspenseSearchUsers,
  useTraderSubscriptions,
} from 'farcaster-client-hooks';
import React from 'react';
import { KeyboardAvoidingView, View } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { TokenListItemPlaceholder } from '../../../components/crypto';
import { useSharedTelemetry, useTheme } from '../../../contexts';
import { useCurrentUserFid, useHaptics } from '../../../hooks';
import { Avatar } from '../../Avatar';
import {
  AnimatedPressable,
  SearchInput,
  SwitchV2,
  Text2,
} from '../../design-system';

function useTraders({ q }: { q: string }) {
  const { data: searchUsersData, fetchNextPage: fetchNextPageSearchUsers } =
    useNonSuspenseSearchUsers({ q });

  const {
    data: traderSubscriptionsData,
    isPending: isPendingTraderSubscriptions,
    refetch: refetchTraderSubscriptions,
  } = useTraderSubscriptions();
  const currentUserFid = useCurrentUserFid();

  const {
    data: followingData,
    fetchNextPage: fetchNextPageFollowing,
    isPending: isPendingFollowing,
  } = useNonSuspenseFollowingWithRefreshOnMount({
    fid: currentUserFid!,
  });

  const traders = React.useMemo(() => {
    const subscriptions = traderSubscriptionsData?.subscriptions ?? [];
    const following =
      followingData?.pages.flatMap((page) => page.result.users) ?? [];

    const subscribedFids = new Set(
      subscriptions.map((subscription) => subscription.targetUser.fid),
    );

    if (q.length > 0) {
      return (
        searchUsersData?.pages.flatMap((page) => page.result.users) ?? []
      ).map((user) => ({
        id: user.fid.toString(),
        user,
        active: subscribedFids.has(user.fid),
        lastNotifiedAt: undefined,
        updatedAt: undefined,
      }));
    }

    const sortedSubscriptions: {
      id: string;
      user: ApiUser;
      active: boolean;
      lastNotifiedAt?: number;
      updatedAt?: number;
    }[] = subscriptions
      .sort((a, b) => {
        if (a.active === b.active) {
          if (a.lastNotifiedAt && b.lastNotifiedAt) {
            return b.lastNotifiedAt - a.lastNotifiedAt;
          }
          if (a.lastNotifiedAt) {
            return -1;
          }
          if (b.lastNotifiedAt) {
            return 1;
          }
          return b.updatedAt - a.updatedAt;
        }
        return a.active ? -1 : 1;
      })
      .map((subscription) => ({
        id: subscription.id,
        user: subscription.targetUser,
        active: subscription.active,
        lastNotifiedAt: subscription.lastNotifiedAt,
        updatedAt: subscription.updatedAt,
      }));

    for (const followingUser of following) {
      if (!subscribedFids.has(followingUser.fid)) {
        sortedSubscriptions.push({
          id: followingUser.fid.toString(),
          user: followingUser,
          active: false,
        });
      }
    }

    return sortedSubscriptions;
  }, [traderSubscriptionsData, followingData, q.length, searchUsersData]);

  const fetchNextPage = React.useCallback(() => {
    if (q.length > 0) {
      fetchNextPageSearchUsers?.();
    } else {
      fetchNextPageFollowing?.();
    }
  }, [fetchNextPageSearchUsers, fetchNextPageFollowing, q.length]);

  const isPending = React.useMemo(() => {
    return isPendingTraderSubscriptions || isPendingFollowing;
  }, [isPendingTraderSubscriptions, isPendingFollowing]);

  const handleRefresh = React.useCallback(async () => {
    await refetchTraderSubscriptions();
  }, [refetchTraderSubscriptions]);

  return {
    traders,
    fetchNextPage,
    isPending,
    handleRefresh,
  };
}

export function WalletAlertsTraders({
  onUserPress,
}: {
  onUserPress: (user: ApiUser) => void;
}) {
  const t = useTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue({
    value: query,
    debounceDuration: 300,
  });

  const { traders, fetchNextPage, isPending, handleRefresh } = useTraders({
    q: debouncedQuery,
  });

  const renderItem = React.useCallback(
    ({
      item,
    }: {
      item: {
        id: string;
        user: ApiUser;
        active: boolean;
        lastNotifiedAt?: number;
        updatedAt?: number;
      };
    }) => {
      return (
        <TraderSubscriptionItem
          key={item.id}
          user={item.user}
          active={item.active}
          lastNotifiedAt={item.lastNotifiedAt}
          updatedAt={item.updatedAt}
          onUserPress={() => onUserPress(item.user)}
          onRefresh={handleRefresh}
        />
      );
    },
    [onUserPress, handleRefresh],
  );

  const ListEmptyComponent = React.useMemo(() => {
    if (isPending) {
      return (
        <View>
          {[...Array(5)].map((_, idx) => (
            <TokenListItemPlaceholder key={idx} hideValue />
          ))}
        </View>
      );
    }

    return null;
  }, [isPending]);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[t.flex1, t.pY3, { gap: 12 }]}
    >
      <View style={[t.pX3]}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search users"
          width="100%"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            t.backgrounds.secondary,
            t.borderHairline,
            t.borders.primary,
            { borderRadius: 12 },
          ]}
          placeholderStyle={[t.fontNormal, t.texts.secondary]}
        />
      </View>

      <Animated.FlatList
        data={traders}
        keyExtractor={(subscription) => subscription.id}
        itemLayoutAnimation={LinearTransition.easing(Easing.inOut(Easing.ease))}
        renderItem={renderItem}
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={ListEmptyComponent}
      />
    </KeyboardAvoidingView>
  );
}

function TraderSubscriptionItem({
  user,
  active,
  lastNotifiedAt,
  updatedAt,
  onUserPress,
  onRefresh,
}: {
  user: ApiUser;
  active: boolean;
  lastNotifiedAt?: number;
  updatedAt?: number;
  onUserPress: () => void;
  onRefresh: () => void;
}) {
  const t = useTheme();
  const opacity = useSharedValue(1);
  const [
    isSubscribedToTraderNotifications,
    setIsSubscribedToTraderNotifications,
  ] = React.useState(active);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState(updatedAt);

  const enableTraderNotifications = useCreateTraderSubscription();
  const disableTraderNotifications = useDeleteTraderSubscription();
  const { triggerImpactAsync } = useHaptics();

  const { trackEvent } = useSharedTelemetry();

  const onPressToggleTraderNotifications = React.useCallback(async () => {
    const DEFAULT_TRADER_NOTIFICATION_THRESHOLD = 10;

    triggerImpactAsync();

    // NOTE: You may be wondering why we are not awaiting these requests here.
    // Since this is not a critical entity update we are relying on the optimistic
    // updates only. If it fails, it will revert anyway, and better to give user
    // another small millis back when they press the button.
    if (isSubscribedToTraderNotifications) {
      setIsSubscribedToTraderNotifications(false);
      await disableTraderNotifications({
        targetFid: user.fid,
        previousMinimumValueUsd: DEFAULT_TRADER_NOTIFICATION_THRESHOLD,
      });
      setLastUpdatedAt(undefined);
      trackEvent(AnalyticsEvent.DisableTraderAlert, {
        targetFid: user.fid,
        type: 'token-swapped',
        minimumValueUsd: DEFAULT_TRADER_NOTIFICATION_THRESHOLD,
      });
      onRefresh();
    } else {
      setIsSubscribedToTraderNotifications(true);
      await enableTraderNotifications({
        targetFid: user.fid,
        type: 'token-swapped',
        minimumValueUsd: DEFAULT_TRADER_NOTIFICATION_THRESHOLD,
      });
      setLastUpdatedAt(Date.now());
      trackEvent(AnalyticsEvent.EnableTraderAlert, {
        targetFid: user.fid,
        type: 'token-swapped',
        minimumValueUsd: DEFAULT_TRADER_NOTIFICATION_THRESHOLD,
      });
      onRefresh();
    }
  }, [
    disableTraderNotifications,
    enableTraderNotifications,
    isSubscribedToTraderNotifications,
    triggerImpactAsync,
    user.fid,
    trackEvent,
    onRefresh,
  ]);

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[opacityStyle]}>
      <View
        style={[
          t.p3,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.bgDefault,
          { gap: 64 },
        ]}
      >
        <AnimatedPressable
          onPress={onUserPress}
          style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}
        >
          <Avatar pfpUrl={user.pfp?.url} diameter={45} />
          <View style={[t.flex1, { gap: 2 }]}>
            <Text2 weight="medium" numberOfLines={1}>
              {user.username}
            </Text2>
            {lastNotifiedAt ? (
              <Text2 color="success" size="xs">
                {`Notified ${formatTimeAgoSuffix(lastNotifiedAt)}`}
              </Text2>
            ) : lastUpdatedAt ? (
              <Text2 color="tertiary" size="xs">
                {`Subscribed ${formatTimeAgoSuffix(lastUpdatedAt)}`}
              </Text2>
            ) : null}
          </View>
        </AnimatedPressable>
        <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
          <View style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}>
            <SwitchV2
              value={isSubscribedToTraderNotifications}
              onValueChange={onPressToggleTraderNotifications}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
