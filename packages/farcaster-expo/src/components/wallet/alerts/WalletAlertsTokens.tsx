import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiEthFungibleTokenPosition,
  ApiOnchainTokenMinimal,
  ApiOnchainTokenNotificationType,
  ApiOnchainTokenSubscription,
  ApiTokenLink,
} from 'farcaster-client-data';
import {
  formatTimeAgoSuffix,
  formatTokenStat,
  useActivateTokenSubscription,
  useCreateTokenSubscription,
  useDeactivateTokenSubscription,
  useDebouncedValue,
  useDeleteTokenSubscription,
  useNonSuspenseToken,
  useNonSuspenseTokenLinks,
  useTokenSubscriptions,
} from 'farcaster-client-hooks';
import {
  ChevronLeft,
  Info,
  Pencil,
  Plus,
  Trash,
  TrendingDown,
  TrendingUp,
  TrendingUpDown,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path } from 'react-native-svg';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { useWalletBalances } from '../../../hooks';
import { useCurrentUserFid } from '../../../hooks/useCurrentUser';
import { useSafeFocusEffect } from '../../../hooks/useSafeFocusEffect';
import {
  formatAssetId,
  isAddress,
  isSameAsset,
  tokenLinkToMinimalToken,
  tokenPositionToMinimalToken,
  tokenPositionToTokenLink,
} from '../../../utils/CryptoUtils';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { TokenIcon, TokenListItemPlaceholder } from '../../crypto';
import { NumPad } from '../../crypto/tokens/swap/Numpad';
import {
  AnimatedPressable,
  SearchInput,
  SwitchV2,
  Text2,
} from '../../design-system';

const formatPrice = (
  value?: number | string,
  showDollarSign = true,
  maxDecimals = 2,
  useGrouping = true,
) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    value = Number(value);
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue < 0.0001) {
    return `${sign}${showDollarSign ? '$' : ''}${absValue.toLocaleString(
      undefined,
      {
        maximumFractionDigits: 8,
        useGrouping,
      },
    )}`;
  }

  if (absValue < 1) {
    return `${sign}${showDollarSign ? '$' : ''}${absValue.toLocaleString(
      undefined,
      {
        maximumFractionDigits: 6,
        useGrouping,
      },
    )}`;
  }

  return `${sign}${showDollarSign ? '$' : ''}${absValue.toLocaleString(
    undefined,
    {
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: maxDecimals,
      useGrouping,
    },
  )}`;
};

export function WalletAlertsToken({
  chain,
  ca,
}: {
  chain: ApiChain;
  ca: string;
}) {
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  const { data, refetch } = useTokenSubscriptions();
  const { data: token } = useNonSuspenseToken({ params: { chain, ca } });
  const { trackEvent } = useSharedTelemetry();

  useSafeFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewTokenAlerts, {
        chain,
        ca,
      });
    }, [trackEvent, chain, ca]),
  );

  const handleRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  const subscriptions = React.useMemo(() => {
    return (
      data?.subscriptions.filter(
        (subscription) =>
          subscription.token.chain === chain && subscription.token.ca === ca,
      ) ?? []
    ).sort((a, b) => {
      if (a.active === b.active) {
        const aTimestamp = a.lastNotifiedAt ?? a.updatedAt;
        const bTimestamp = b.lastNotifiedAt ?? b.updatedAt;
        return bTimestamp - aTimestamp;
      }
      return a.active ? -1 : 1;
    });
  }, [data, chain, ca]);

  const header = React.useMemo(() => {
    const name = token?.token?.name ?? token?.token?.ticker;
    return `${name} Alerts`;
  }, [token?.token?.name, token?.token?.ticker]);

  if (!data) {
    return null;
  }

  return (
    <View style={[t.flex1, t.pY3, { gap: 12 }]}>
      <View style={[t.flexRow, t.pX3, t.itemsCenter, { gap: 8 }]}>
        <AnimatedPressable onPress={goBack}>
          <ChevronLeft size={24} color={t.colors.text.secondary} />
        </AnimatedPressable>
        <Text2 size="xl" weight="semibold">
          {header}
        </Text2>
      </View>
      <TokenSubscriptions
        subscriptions={subscriptions}
        token={token?.token}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

export function WalletAlertsTokens() {
  const { data, refetch } = useTokenSubscriptions();

  const subscriptions = React.useMemo(() => {
    const subscriptions = (data?.subscriptions ?? []).sort((a, b) => {
      if (a.active === b.active) {
        const aTimestamp = a.lastNotifiedAt ?? a.updatedAt;
        const bTimestamp = b.lastNotifiedAt ?? b.updatedAt;
        return bTimestamp - aTimestamp;
      }
      return a.active ? -1 : 1;
    });

    return subscriptions;
  }, [data]);

  const handleRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (!data) {
    return null;
  }

  return (
    <WalletAlertsTokensInner
      subscriptions={subscriptions}
      onRefresh={handleRefresh}
    />
  );
}

function WalletAlertsTokensInner({
  subscriptions,
  onRefresh,
}: {
  subscriptions: ApiOnchainTokenSubscription[];
  onRefresh: () => Promise<void>;
}) {
  const t = useTheme();
  const [selectedTab, setSelectedTab] = React.useState<'alerts' | 'tokens'>(
    subscriptions.length > 0 ? 'alerts' : 'tokens',
  );
  const [query, setQuery] = React.useState('');

  const debouncedQuery = useDebouncedValue({
    value: query.trim(),
    debounceDuration: 300,
  });

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[t.flex1, t.pY3, { gap: 12 }]}
    >
      <View style={[t.pX3]}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tokens on Base or Solana"
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
      {debouncedQuery.length === 0 && (
        <View style={[t.flexRow, { gap: 8, paddingHorizontal: 12 }]}>
          <TabPill
            onPress={() => setSelectedTab('alerts')}
            selected={selectedTab === 'alerts'}
            label="Your Alerts"
          />
          <TabPill
            onPress={() => setSelectedTab('tokens')}
            selected={selectedTab === 'tokens'}
            label="Your Tokens"
          />
        </View>
      )}
      {debouncedQuery.length > 0 ? (
        <SearchResults
          query={debouncedQuery}
          subscriptions={subscriptions}
          onRefresh={onRefresh}
        />
      ) : selectedTab === 'alerts' ? (
        <TokenSubscriptions
          subscriptions={subscriptions}
          onRefresh={onRefresh}
        />
      ) : (
        <YourBalances subscriptions={subscriptions} onRefresh={onRefresh} />
      )}
    </KeyboardAvoidingView>
  );
}

function TabPill({
  onPress,
  selected,
  label,
}: {
  onPress: () => void;
  selected: boolean;
  label: string;
}) {
  const t = useTheme();
  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={[
          t.flex,
          t.itemsCenter,
          t.borderHairline,
          {
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 9,
            borderRadius: 16,
          },
          selected ? t.backgrounds.brandLight : t.backgrounds.default,
          t.borders.primary,
        ]}
      >
        <Text2
          weight="medium"
          style={
            selected
              ? t.dark
                ? t.texts.primary
                : t.texts.brand
              : t.texts.secondary
          }
        >
          {label}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}

function SearchResults({
  query,
  subscriptions,
  onRefresh,
}: {
  query: string;
  subscriptions: ApiOnchainTokenSubscription[];
  onRefresh: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const viewerFid = useCurrentUserFid();
  const { data, isPending } = useNonSuspenseTokenLinks({
    ticker: query,
    intent: 'typeahead',
    contextFid: viewerFid,
  });

  const [addSubscriptionBottomSheet, setAddSubscriptionBottomSheet] =
    React.useState<ApiOnchainTokenMinimal | null>(null);

  const handleRefresh = React.useCallback(async () => {
    await onRefresh();
    setAddSubscriptionBottomSheet(null);
  }, [onRefresh]);

  const keyExtractor = React.useCallback((token: ApiTokenLink) => {
    return `${token.chain}:${token.ca}`;
  }, []);

  const ListEmptyComponent = React.useMemo(() => {
    if (isPending) {
      return (
        <View>
          {Array.from({ length: isAddress(query) ? 1 : 5 }).map((_, index) => (
            <TokenListItemPlaceholder key={index} hideValue />
          ))}
        </View>
      );
    }

    return (
      <View>
        <Text2 color="tertiary" align="center">
          No results found for "{query}"
        </Text2>
      </View>
    );
  }, [isPending, query]);

  const tokens = React.useMemo(() => {
    return (data?.tokens ?? [])
      .filter((token) => ['base', 'solana'].includes(token.chain))
      .map((token) => ({
        ...token,
        subscriptions: subscriptions.filter((subscription) =>
          isSameAsset({
            chain: subscription.token.chain,
            ca: subscription.token.ca,
            asset: tokenLinkToMinimalToken(token),
          }),
        ).length,
      }));
  }, [data, subscriptions]);

  const renderItem = React.useCallback(
    ({
      item,
    }: {
      item: ApiTokenLink & {
        subscriptions: number;
      };
    }) => {
      return (
        <SearchResultsItem
          key={`${item.chain}:${item.ca}`}
          token={item}
          subscriptions={item.subscriptions}
          onAddSubscription={() => {
            Keyboard.dismiss();
            setAddSubscriptionBottomSheet(tokenLinkToMinimalToken(item));
          }}
        />
      );
    },
    [setAddSubscriptionBottomSheet],
  );

  return (
    <>
      <FlashList
        data={tokens}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="always"
      />
      {addSubscriptionBottomSheet && (
        <AddAlertBottomSheet
          onDismiss={() => setAddSubscriptionBottomSheet(null)}
          token={addSubscriptionBottomSheet}
          onAddAlert={handleRefresh}
        />
      )}
    </>
  );
}

function SearchResultsItem({
  token,
  subscriptions,
  onAddSubscription,
}: {
  token: ApiTokenLink;
  subscriptions: number;
  onAddSubscription: () => void;
}) {
  const t = useTheme();
  return (
    <AnimatedPressable onPress={onAddSubscription}>
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
        <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <TokenIcon
            iconUrl={token.imageUrl}
            symbol={token.ticker}
            diameter={45}
            chain={token.chain}
            badgeOffset={{ top: -2, right: -2 }}
          />
          <View style={(t.flex1, [{ gap: 4 }])}>
            <Text2 weight="medium" numberOfLines={1}>
              {token.name ?? token.ticker}
            </Text2>
            <Text2 color="tertiary" size="xs">
              {`${token.priceUsd ? `${formatPrice(token.priceUsd)} ∙ ` : ''}${subscriptions === 0 ? 'No' : subscriptions} alerts`}
            </Text2>
          </View>
        </View>
        <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              t.pL1,
              t.pR2,
              t.pY1,
            ]}
          >
            <Plus size={16} color={t.colors.text.light} />
            <Text2 size="xs" weight="semibold" color="light">
              Add
            </Text2>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function TokenSubscriptions({
  subscriptions: initialSubscriptions,
  token,
  onRefresh,
}: {
  subscriptions: ApiOnchainTokenSubscription[];
  token?: ApiTokenLink;
  onRefresh: () => Promise<void>;
}) {
  const t = useTheme();
  const deleteTokenSubscription = useDeleteTokenSubscription();
  const [addSubscriptionBottomSheet, setAddSubscriptionBottomSheet] =
    React.useState<ApiOnchainTokenMinimal | null>(null);
  const [editSubscriptionBottomSheet, setEditSubscriptionBottomSheet] =
    React.useState<ApiOnchainTokenSubscription | null>(null);
  const [deletedSubscription, setDeletedSubscription] =
    React.useState<ApiOnchainTokenSubscription | null>(null);

  const handleRefresh = React.useCallback(async () => {
    await onRefresh();
    setAddSubscriptionBottomSheet(null);
    setEditSubscriptionBottomSheet(null);
  }, [onRefresh]);

  const handleEdit = React.useCallback(
    (subscription: ApiOnchainTokenSubscription) => {
      setEditSubscriptionBottomSheet(subscription);
    },
    [setEditSubscriptionBottomSheet],
  );

  const handleDelete = React.useCallback(
    async (subscription: ApiOnchainTokenSubscription) => {
      setDeletedSubscription(subscription);
      await deleteTokenSubscription({
        params: { subscriptionId: subscription.id },
      });
      await handleRefresh();
    },
    [deleteTokenSubscription, handleRefresh],
  );

  const subscriptions = React.useMemo(() => {
    return initialSubscriptions.filter(
      (subscription) => subscription.id !== deletedSubscription?.id,
    );
  }, [initialSubscriptions, deletedSubscription]);

  const renderItem = React.useCallback(
    ({ item }: { item: ApiOnchainTokenSubscription }) => {
      return (
        <TokenSubscriptionItem
          key={item.id}
          subscription={item}
          onEdit={handleEdit}
          refreshSubscriptions={handleRefresh}
          onDelete={handleDelete}
          variant={!token ? 'token' : 'default'}
        />
      );
    },
    [handleEdit, handleRefresh, handleDelete, token],
  );

  return (
    <>
      <Animated.FlatList
        data={subscriptions}
        keyExtractor={(subscription) => subscription.id}
        itemLayoutAnimation={LinearTransition.easing(Easing.inOut(Easing.ease))}
        renderItem={renderItem}
        ListEmptyComponent={TokenSubscriptionEmpty}
        scrollEnabled={subscriptions.length > 0}
        contentContainerStyle={
          subscriptions.length > 0 ? undefined : { flex: 1 }
        }
      />
      {token && (
        <AnimatedPressable
          style={[t.pX3, { height: 48 }]}
          onPress={() =>
            setAddSubscriptionBottomSheet(tokenLinkToMinimalToken(token))
          }
        >
          <View
            style={[
              t.flex1,
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Add alert
            </Text2>
          </View>
        </AnimatedPressable>
      )}
      {addSubscriptionBottomSheet && (
        <AddAlertBottomSheet
          onDismiss={() => setAddSubscriptionBottomSheet(null)}
          token={addSubscriptionBottomSheet}
          onAddAlert={handleRefresh}
        />
      )}
      {editSubscriptionBottomSheet && (
        <EditAlertBottomSheet
          onDismiss={() => setEditSubscriptionBottomSheet(null)}
          subscription={editSubscriptionBottomSheet}
          onEditAlert={handleRefresh}
          onDeleteAlert={() => handleDelete(editSubscriptionBottomSheet)}
        />
      )}
    </>
  );
}

function YourBalances({
  subscriptions,
  onRefresh,
}: {
  subscriptions: ApiOnchainTokenSubscription[];
  onRefresh: () => Promise<void>;
}) {
  const [addSubscriptionBottomSheet, setAddSubscriptionBottomSheet] =
    React.useState<ApiOnchainTokenMinimal | null>(null);

  const { balances } = useWalletBalances();

  const filteredBalances = React.useMemo(() => {
    return balances
      .filter(
        (balance) =>
          ['base', 'solana'].includes(balance.chain) &&
          !balance.userHidden &&
          !balance.hidden,
      )
      .map((balance) => ({
        ...balance,
        subscriptions: subscriptions.filter((subscription) =>
          isSameAsset({
            chain: subscription.token.chain,
            ca: subscription.token.ca,
            asset: tokenPositionToMinimalToken(balance),
          }),
        ).length,
      }));
  }, [balances, subscriptions]);

  const handleRefresh = React.useCallback(async () => {
    await onRefresh();
    setAddSubscriptionBottomSheet(null);
  }, [onRefresh]);

  const renderItem = React.useCallback(
    ({
      item,
    }: {
      item: ApiEthFungibleTokenPosition & { subscriptions: number };
    }) => {
      const token = tokenPositionToTokenLink(item);
      return (
        <SearchResultsItem
          key={`${item.chain}:${item.address}`}
          token={token}
          onAddSubscription={() =>
            setAddSubscriptionBottomSheet(tokenLinkToMinimalToken(token))
          }
          subscriptions={item.subscriptions}
        />
      );
    },
    [setAddSubscriptionBottomSheet],
  );

  return (
    <>
      <Animated.FlatList
        data={filteredBalances}
        keyExtractor={(balance) =>
          formatAssetId(balance.chain, balance.address)
        }
        itemLayoutAnimation={LinearTransition.easing(Easing.inOut(Easing.ease))}
        renderItem={renderItem}
      />
      {addSubscriptionBottomSheet && (
        <AddAlertBottomSheet
          onDismiss={() => setAddSubscriptionBottomSheet(null)}
          token={addSubscriptionBottomSheet}
          onAddAlert={handleRefresh}
        />
      )}
    </>
  );
}

function TokenSubscriptionItem({
  subscription,
  onEdit,
  refreshSubscriptions,
  onDelete,
  variant,
}: {
  subscription: ApiOnchainTokenSubscription;
  onEdit: (subscription: ApiOnchainTokenSubscription) => void;
  refreshSubscriptions: () => Promise<void>;
  onDelete: (subscription: ApiOnchainTokenSubscription) => Promise<void>;
  variant: 'token' | 'default';
}) {
  const t = useTheme();
  const activateTokenSubscription = useActivateTokenSubscription();
  const deactivateTokenSubscription = useDeactivateTokenSubscription();
  const swipeableRef = React.useRef<SwipeableMethods>(null);
  const isAlerting = React.useRef(false);
  const opacity = useSharedValue(1);
  const [active, setActive] = React.useState(subscription.active);

  const label = React.useMemo(() => {
    const percentage = subscription.percentChange
      ? `${(subscription.percentChange * 100).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}% `
      : ``;

    const amount =
      subscription.upperTargetPriceUsd ?? subscription.lowerTargetPriceUsd;

    if (subscription.type === 'watchlist-algo') {
      return `Watchlist alerts`;
    } else if (subscription.type === 'price-movement-pct-up') {
      return `Price is up ${percentage}`;
    } else if (subscription.type === 'price-movement-pct-down') {
      return `Price is down ${percentage}`;
    } else if (subscription.type === 'price-movement-pct') {
      return `Price changes by ${percentage}`;
    } else if (subscription.type === 'price-target') {
      return `Price crosses ${amount ? formatPrice(amount) : ''}`;
    } else if (subscription.type === 'price-target-market-cap') {
      const currentPriceUsd = subscription.token.priceUsd ?? 0;
      const targetPriceUsd = amount ?? 0;
      const ratio = targetPriceUsd / currentPriceUsd;

      const currentMarketCapUsd = subscription.token.marketCap ?? 0;
      const targetMarketCapUsd = currentMarketCapUsd * ratio;

      return `Market cap crosses ${formatTokenStat(targetMarketCapUsd)}`;
    }
  }, [
    subscription.type,
    subscription.percentChange,
    subscription.upperTargetPriceUsd,
    subscription.lowerTargetPriceUsd,
    subscription.token,
  ]);

  const { trackEvent } = useSharedTelemetry();

  const handleToggle = React.useCallback(
    async (value: boolean) => {
      setActive(value);
      if (value) {
        await activateTokenSubscription({
          params: { subscriptionId: subscription.id },
        });
        trackEvent(AnalyticsEvent.EnableTokenAlert, {
          type: subscription.type,
          startingPriceUsd: subscription.startingPriceUsd,
          upperTargetPriceUsd: subscription.upperTargetPriceUsd,
          lowerTargetPriceUsd: subscription.lowerTargetPriceUsd,
          percentChange: subscription.percentChange,
          chain: subscription.token.chain,
          ca: subscription.token.ca,
        });
      } else {
        await deactivateTokenSubscription({
          params: { subscriptionId: subscription.id },
        });
        trackEvent(AnalyticsEvent.DisableTokenAlert, {
          type: subscription.type,
          startingPriceUsd: subscription.startingPriceUsd,
          upperTargetPriceUsd: subscription.upperTargetPriceUsd,
          lowerTargetPriceUsd: subscription.lowerTargetPriceUsd,
          percentChange: subscription.percentChange,
          chain: subscription.token.chain,
          ca: subscription.token.ca,
        });
      }
      await refreshSubscriptions();
    },
    [
      activateTokenSubscription,
      deactivateTokenSubscription,
      subscription.id,
      refreshSubscriptions,
      trackEvent,
      subscription.type,
      subscription.startingPriceUsd,
      subscription.upperTargetPriceUsd,
      subscription.lowerTargetPriceUsd,
      subscription.percentChange,
      subscription.token.chain,
      subscription.token.ca,
    ],
  );

  const handleEdit = React.useCallback(() => {
    onEdit(subscription);
  }, [onEdit, subscription]);

  const handleDelete = React.useCallback(async () => {
    if (isAlerting.current) {
      return;
    }

    isAlerting.current = true;

    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this price alert?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Reset the swipeable to closed position
            swipeableRef.current?.close();
            isAlerting.current = false;
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            opacity.set(withTiming(0));
            await onDelete(subscription);
            trackEvent(AnalyticsEvent.DeleteTokenAlert, {
              type: subscription.type,
              startingPriceUsd: subscription.startingPriceUsd,
              upperTargetPriceUsd: subscription.upperTargetPriceUsd,
              lowerTargetPriceUsd: subscription.lowerTargetPriceUsd,
              percentChange: subscription.percentChange,
              chain: subscription.token.chain,
              ca: subscription.token.ca,
            });
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          // Also reset when dismissed by tapping outside
          swipeableRef.current?.close();
        },
      },
    );
  }, [onDelete, subscription, opacity, trackEvent]);

  const RightAction = (
    prog: SharedValue<number>,
    drag: SharedValue<number>,
  ) => {
    const styleAnimation = useAnimatedStyle(() => {
      // Interpolate opacity based on swipe progress
      const opacity = prog.value > 0.5 ? 1 : prog.value * 2;

      return {
        transform: [{ translateX: drag.value + 120 }],
        opacity,
      };
    });

    return (
      <Animated.View
        style={[
          styleAnimation,
          {
            width: 120,
            height: '100%',
            backgroundColor: t.colors.red500,
          },
        ]}
      >
        <AnimatedPressable
          onPress={handleDelete}
          style={[
            t.justifyCenter,
            t.itemsCenter,
            t.hFull,
            t.pX3,
            {
              width: 120,
            },
          ]}
        >
          <Text2 weight="medium" color="light">
            Delete
          </Text2>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const Component = React.useMemo(() => {
    return (
      <AnimatedPressable onPress={handleEdit}>
        <View
          style={[
            t.pX3,
            t.pY1,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.bgDefault,
            { gap: 64 },
          ]}
        >
          <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
            {variant === 'token' && (
              <TokenIcon
                iconUrl={subscription.token.imageUrl}
                symbol={subscription.token.symbol}
                diameter={45}
              />
            )}
            <View style={[t.flex1, { gap: 2 }]}>
              <Text2 weight="medium" numberOfLines={1}>
                {variant === 'token'
                  ? (subscription.token.name ?? subscription.token.symbol)
                  : label}
              </Text2>
              {variant === 'token' ? (
                <Text2 color="tertiary" size="xs">
                  {label}
                </Text2>
              ) : subscription.lastNotifiedAt ? (
                <Text2 color="success" size="xs">
                  {`Notified ${formatTimeAgoSuffix(subscription.lastNotifiedAt)}`}
                </Text2>
              ) : (
                <Text2 color="tertiary" size="xs">
                  {`Updated ${formatTimeAgoSuffix(subscription.updatedAt)}`}
                </Text2>
              )}
            </View>
          </View>
          <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
            <Pencil
              size={20}
              color={t.colors.text.secondary}
              fill={t.colors.text.secondary}
            />
            <View style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}>
              <SwitchV2 value={active} onValueChange={handleToggle} />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  }, [
    active,
    handleToggle,
    variant,
    subscription,
    label,
    handleEdit,
    t.bgDefault,
    t.colors.text.secondary,
    t.flex1,
    t.flexRow,
    t.itemsCenter,
    t.justifyBetween,
    t.pX3,
    t.pY1,
  ]);

  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    return (
      <Animated.View style={[opacityStyle]}>
        <ReanimatedSwipeable
          containerStyle={[t.mY2]}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={60}
          renderRightActions={RightAction}
        >
          {Component}
        </ReanimatedSwipeable>
      </Animated.View>
    );
  }

  return <Animated.View style={[opacityStyle]}>{Component}</Animated.View>;
}

function TokenSubscriptionEmpty() {
  const t = useTheme();

  return (
    <View
      style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pX10, { gap: 12 }]}
    >
      <Svg width="86" height="117" viewBox="0 0 86 117" fill="none">
        <Path
          d="M37.9482 74.625C38.4602 75.5244 39.1966 76.2712 40.0834 76.7905C40.9701 77.3097 41.976 77.5831 42.9999 77.5831C44.0238 77.5831 45.0297 77.3097 45.9164 76.7905C46.8032 76.2712 47.5396 75.5244 48.0516 74.625"
          stroke={t.colors.text.tertiary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M72.1663 36.1665C72.1663 29.3623 69.833 23.4457 66.333 18.4165"
          stroke={t.colors.text.tertiary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M17.514 57.8393C17.133 58.2628 16.8815 58.7896 16.7902 59.3555C16.6989 59.9213 16.7718 60.5019 16.9998 61.0266C17.2278 61.5512 17.6013 61.9974 18.0747 62.3107C18.5482 62.624 19.1012 62.7911 19.6665 62.7915H66.3332C66.8984 62.7917 67.4515 62.6253 67.9253 62.3126C68.399 61.9998 68.7729 61.5542 69.0016 61.0299C69.2302 60.5055 69.3038 59.9251 69.2132 59.3592C69.1226 58.7933 68.8719 58.2663 68.4915 57.8422C64.6123 53.7863 60.4998 49.476 60.4998 36.1665C60.4998 31.4589 58.6561 26.9441 55.3742 23.6154C52.0923 20.2866 47.6411 18.4165 42.9998 18.4165C38.3585 18.4165 33.9073 20.2866 30.6255 23.6154C27.3436 26.9441 25.4998 31.4589 25.4998 36.1665C25.4998 49.476 21.3844 53.7863 17.514 57.8393Z"
          fill={t.colors.text.tertiary}
          stroke={t.colors.text.tertiary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M19.6663 18.4165C16.1663 23.4457 13.833 29.3623 13.833 36.1665"
          stroke={t.colors.text.tertiary}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Ellipse
          cx="43"
          cy="100"
          rx="28"
          ry="4.5"
          fill={t.colors.text.tertiary}
        />
      </Svg>
      <Text2 color="secondary" align="center" weight="medium">
        Don't miss a trade. Get instant notifications when prices change.
      </Text2>
    </View>
  );
}

export function AddAlertBottomSheet({
  onDismiss,
  token,
  onAddAlert,
  displayedInModalPresentationScreen,
  via = 'default',
}: {
  onDismiss: () => void;
  token: ApiOnchainTokenMinimal;
  onAddAlert: () => Promise<void> | void;
  displayedInModalPresentationScreen?: boolean;
  via?: string;
}) {
  const [type, setType] =
    React.useState<ApiOnchainTokenNotificationType>('price-movement-pct');
  const [percentChange, setPercentChange] = React.useState<string>('10');
  const [priceTarget, setPriceTarget] = React.useState<string>(
    token.priceUsd.toString(),
  );
  const [isCustom, setIsCustom] = React.useState<boolean>(false);
  const [isAddingAlert, setIsAddingAlert] = React.useState<boolean>(false);
  const createTokenSubscription = useCreateTokenSubscription();

  const params = React.useMemo(() => {
    const startingPriceUsd = Number(token.priceUsd ?? '0');
    let upperTargetPriceUsd: number | undefined;
    let lowerTargetPriceUsd: number | undefined;

    let percentChangeFloat = percentChange
      ? parseFloat(percentChange) / 100
      : undefined;

    let notificationType: ApiOnchainTokenNotificationType = 'price-target';

    if (type === 'price-target') {
      notificationType = 'price-target';
      const priceTargetFloat = parseFloat(priceTarget);
      if (priceTargetFloat >= startingPriceUsd) {
        upperTargetPriceUsd = priceTargetFloat;
      } else {
        lowerTargetPriceUsd = priceTargetFloat;
      }
      percentChangeFloat = undefined;
    } else if (type === 'price-target-market-cap') {
      notificationType = 'price-target-market-cap';
      const priceTargetFloat = parseFloat(priceTarget);
      if (priceTargetFloat >= startingPriceUsd) {
        upperTargetPriceUsd = priceTargetFloat;
      } else {
        lowerTargetPriceUsd = priceTargetFloat;
      }
      percentChangeFloat = undefined;
    } else if (type === 'price-movement-pct-up') {
      if (!percentChangeFloat) {
        return;
      }
      notificationType = 'price-movement-pct-up';
      upperTargetPriceUsd = startingPriceUsd * (1 + percentChangeFloat);
    } else if (type === 'price-movement-pct-down') {
      if (!percentChangeFloat) {
        return;
      }
      notificationType = 'price-movement-pct-down';
      lowerTargetPriceUsd = startingPriceUsd * (1 - percentChangeFloat);
    } else if (type === 'price-movement-pct') {
      if (!percentChangeFloat) {
        return;
      }
      notificationType = 'price-movement-pct';
      upperTargetPriceUsd = startingPriceUsd * (1 + percentChangeFloat);
      lowerTargetPriceUsd = startingPriceUsd * (1 - percentChangeFloat);
    }

    return {
      type: notificationType,
      startingPriceUsd,
      upperTargetPriceUsd,
      lowerTargetPriceUsd,
      percentChange: percentChangeFloat,
      chain: token.chain,
      ca: token.ca,
      via,
    };
  }, [type, percentChange, priceTarget, token, via]);

  const { trackEvent } = useSharedTelemetry();
  const handleSubmit = React.useCallback(async () => {
    setIsAddingAlert(true);

    if (!params) {
      return;
    }

    await createTokenSubscription({ params });
    await onAddAlert();
    setIsAddingAlert(false);
    trackEvent(AnalyticsEvent.AddTokenAlert, params);
  }, [createTokenSubscription, params, onAddAlert, trackEvent]);

  return (
    <AutoDisplayingBottomSheetModal
      name="addAlertBottomSheet"
      onDismiss={onDismiss}
      displayedInModalPresentationScreen={displayedInModalPresentationScreen}
    >
      <AlertForm
        title="Add alert"
        type={type}
        setType={setType}
        isCustom={isCustom}
        percentChange={percentChange}
        setPercentChange={setPercentChange}
        setIsCustom={setIsCustom}
        priceTarget={priceTarget}
        setPriceTarget={setPriceTarget}
        priceUsd={token.priceUsd ? Number(token.priceUsd) : 0}
        marketCapUsd={token.marketCap ?? 0}
        onSubmit={handleSubmit}
        isSubmitting={isAddingAlert}
        buttonText="Add alert"
      />
    </AutoDisplayingBottomSheetModal>
  );
}

function EditAlertBottomSheet({
  subscription,
  onDismiss,
  onEditAlert,
  onDeleteAlert,
}: {
  subscription: ApiOnchainTokenSubscription;
  onDismiss: () => void;
  onEditAlert: () => Promise<void>;
  onDeleteAlert: () => Promise<void>;
}) {
  const initialValues = (() => {
    const percentChange = subscription.percentChange
      ? (subscription.percentChange * 100).toString()
      : '5';
    const priceTarget =
      subscription.upperTargetPriceUsd?.toString() ??
      subscription.lowerTargetPriceUsd?.toString() ??
      subscription.token.priceUsd ??
      '0';

    let type = 'price-movement-pct';
    let direction = 'up';

    switch (subscription.type) {
      case 'price-movement-pct-up':
        type = 'price-movement-pct-up';
        direction = 'up';
        break;
      case 'price-movement-pct-down':
        type = 'price-movement-pct-down';
        direction = 'down';
        break;
      case 'price-movement-pct':
        type = 'price-movement-pct';
        direction = 'crosses';
        break;
      case 'price-target':
        type = 'price-target';
        direction = 'up';
        break;
      case 'price-target-market-cap':
        type = 'price-target-market-cap';
        direction = 'up';
        break;
      default:
        type = 'price-movement-pct';
        direction = 'up';
        break;
    }

    return {
      type,
      direction,
      percentChange,
      priceTarget,
      isCustom: !['5', '10', '20', '50', '100'].includes(percentChange),
    };
  })();

  const [type, setType] = React.useState<ApiOnchainTokenNotificationType>(
    initialValues.type as ApiOnchainTokenNotificationType,
  );
  const [percentChange, setPercentChange] = React.useState<string>(
    initialValues.percentChange,
  );
  const [priceTarget, setPriceTarget] = React.useState<string>(
    initialValues.priceTarget.toString(),
  );
  const [isCustom, setIsCustom] = React.useState<boolean>(
    initialValues.isCustom,
  );
  const [isEditingAlert, setIsEditingAlert] = React.useState<boolean>(false);
  const createTokenSubscription = useCreateTokenSubscription();

  const params = React.useMemo(() => {
    const startingPriceUsd = Number(subscription.token.priceUsd ?? '0');
    let upperTargetPriceUsd: number | undefined;
    let lowerTargetPriceUsd: number | undefined;

    let percentChangeFloat = percentChange
      ? parseFloat(percentChange) / 100
      : undefined;

    let notificationType: ApiOnchainTokenNotificationType = 'price-target';

    if (type === 'price-target') {
      notificationType = 'price-target';
      const priceTargetFloat = parseFloat(priceTarget);
      if (priceTargetFloat >= startingPriceUsd) {
        upperTargetPriceUsd = priceTargetFloat;
      } else {
        lowerTargetPriceUsd = priceTargetFloat;
      }
      percentChangeFloat = undefined;
    } else if (type === 'price-target-market-cap') {
      notificationType = 'price-target-market-cap';
      const priceTargetFloat = parseFloat(priceTarget);
      if (priceTargetFloat >= startingPriceUsd) {
        upperTargetPriceUsd = priceTargetFloat;
      } else {
        lowerTargetPriceUsd = priceTargetFloat;
      }
      percentChangeFloat = undefined;
    } else if (type === 'price-movement-pct-up') {
      if (!percentChangeFloat) {
        return;
      }
      notificationType = 'price-movement-pct-up';
      upperTargetPriceUsd = startingPriceUsd * (1 + percentChangeFloat);
    } else if (type === 'price-movement-pct-down') {
      if (!percentChangeFloat) {
        return;
      }
      notificationType = 'price-movement-pct-down';
      lowerTargetPriceUsd = startingPriceUsd * (1 - percentChangeFloat);
    } else if (type === 'price-movement-pct') {
      if (!percentChangeFloat) {
        return;
      }
      notificationType = 'price-movement-pct';
      upperTargetPriceUsd = startingPriceUsd * (1 + percentChangeFloat);
      lowerTargetPriceUsd = startingPriceUsd * (1 - percentChangeFloat);
    }

    return {
      subscriptionId: subscription.id,
      type: notificationType,
      startingPriceUsd,
      upperTargetPriceUsd,
      lowerTargetPriceUsd,
      percentChange: percentChangeFloat,
      chain: subscription.token.chain,
      ca: subscription.token.ca,
    };
  }, [type, percentChange, priceTarget, subscription.id, subscription.token]);

  const { trackEvent } = useSharedTelemetry();
  const handleSubmit = React.useCallback(async () => {
    setIsEditingAlert(true);

    if (!params) {
      return;
    }

    await createTokenSubscription({ params });
    await onEditAlert();
    setIsEditingAlert(false);
    trackEvent(AnalyticsEvent.EditTokenAlert, params);
  }, [createTokenSubscription, params, onEditAlert, trackEvent]);

  const isAlerting = React.useRef<boolean>(false);
  const handleDelete = React.useCallback(async () => {
    if (isAlerting.current) {
      return;
    }

    isAlerting.current = true;

    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this price alert?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            isAlerting.current = false;
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await onDeleteAlert();
            trackEvent(AnalyticsEvent.DeleteTokenAlert, {
              type: subscription.type,
              startingPriceUsd: subscription.startingPriceUsd,
              upperTargetPriceUsd: subscription.upperTargetPriceUsd,
              lowerTargetPriceUsd: subscription.lowerTargetPriceUsd,
              percentChange: subscription.percentChange,
              chain: subscription.token.chain,
              ca: subscription.token.ca,
            });
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          isAlerting.current = false;
        },
      },
    );
  }, [subscription, trackEvent, onDeleteAlert]);

  return (
    <AutoDisplayingBottomSheetModal
      name="editAlertBottomSheet"
      onDismiss={onDismiss}
    >
      <AlertForm
        title="Edit alert"
        type={type}
        setType={setType}
        isCustom={isCustom}
        percentChange={percentChange}
        setPercentChange={setPercentChange}
        setIsCustom={setIsCustom}
        priceTarget={priceTarget}
        setPriceTarget={setPriceTarget}
        priceUsd={
          subscription.token.priceUsd ? Number(subscription.token.priceUsd) : 0
        }
        marketCapUsd={subscription.token.marketCap ?? 0}
        onSubmit={handleSubmit}
        isSubmitting={isEditingAlert}
        buttonText="Save alert"
        onDelete={handleDelete}
      />
    </AutoDisplayingBottomSheetModal>
  );
}

function AlertForm({
  title,
  type,
  setType,
  isCustom,
  percentChange,
  setPercentChange,
  setIsCustom,
  priceTarget,
  setPriceTarget,
  priceUsd,
  marketCapUsd,
  onSubmit,
  isSubmitting,
  buttonText,
  onDelete,
}: {
  title: string;
  type: ApiOnchainTokenNotificationType;
  setType: (type: ApiOnchainTokenNotificationType) => void;
  isCustom: boolean;
  percentChange: string;
  setPercentChange: (percentChange: string) => void;
  setIsCustom: (isCustom: boolean) => void;
  priceTarget: string;
  setPriceTarget: (priceTarget: string) => void;
  priceUsd: number;
  marketCapUsd: number;
  onSubmit: () => void;
  isSubmitting: boolean;
  buttonText: string;
  onDelete?: () => Promise<void>;
}) {
  const t = useTheme();

  const isPriceMovement = React.useMemo(() => {
    return [
      'price-movement-pct-up',
      'price-movement-pct-down',
      'price-movement-pct',
    ].includes(type);
  }, [type]);

  return (
    <Animated.View style={{ gap: 24 }} entering={FadeIn}>
      <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2 size="xl" weight="semibold">
          {title}
        </Text2>
        {onDelete && (
          <AnimatedPressable
            onPress={onDelete}
            style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
          >
            <Trash size={16} color={t.colors.text.danger} />
            <Text2 size="sm" color="danger" weight="medium">
              Delete
            </Text2>
          </AnimatedPressable>
        )}
      </View>
      <AlertFormType
        hasMarketCap={marketCapUsd > 0}
        type={type}
        setType={setType}
      />
      <View style={{ gap: 16 }}>
        {isPriceMovement && (
          <AlertFormDirection type={type} setType={setType} />
        )}
        {!isPriceMovement && (
          <AlertFormTargetType type={type} setType={setType} />
        )}
        <AlertFormInfo type={type} />
      </View>
      {isPriceMovement && (
        <AlertFormPercentChange
          percentChange={percentChange}
          setPercentChange={setPercentChange}
          isCustom={isCustom}
          setIsCustom={setIsCustom}
        />
      )}
      {!isPriceMovement && (
        <AlertFormPriceTarget
          priceUsd={priceUsd}
          marketCapUsd={marketCapUsd}
          priceTarget={priceTarget}
          setPriceTarget={setPriceTarget}
          type={type}
        />
      )}
      <AnimatedPressable
        style={{ height: 48 }}
        onPress={onSubmit}
        disabled={isSubmitting || (isCustom && !percentChange)}
      >
        <View
          style={[
            t.flex1,
            t.backgrounds.brand,
            { borderRadius: 32 },
            t.justifyCenter,
            t.itemsCenter,
            { height: 48 },
            (isSubmitting || (isCustom && !percentChange)) && t.opacity50,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={t.colors.text.light} />
          ) : (
            <Text2 size="lg" weight="semibold" color="light">
              {buttonText}
            </Text2>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function AlertFormType({
  hasMarketCap,
  type,
  setType,
}: {
  hasMarketCap: boolean;
  type: ApiOnchainTokenNotificationType;
  setType: (type: ApiOnchainTokenNotificationType) => void;
}) {
  const t = useTheme();

  const TYPE_OPTIONS = [
    {
      id: 'price-movement',
      default: 'price-movement-pct',
      label: 'Price movement',
    },
    {
      id: 'price-target',
      default: hasMarketCap ? 'price-target-market-cap' : 'price-target',
      label: 'Price target',
    },
  ] as const;

  return (
    <View style={[{ gap: 12 }]}>
      <Text2 size="sm" color="secondary" weight="semibold">
        Type
      </Text2>
      <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
        {TYPE_OPTIONS.map((option) => (
          <Button
            key={option.id}
            isSelected={
              option.id === 'price-movement'
                ? [
                    'price-movement-pct',
                    'price-movement-pct-up',
                    'price-movement-pct-down',
                  ].includes(type)
                : ['price-target-market-cap', 'price-target'].includes(type)
            }
            onPress={() => setType(option.default)}
            label={option.label}
          />
        ))}
      </View>
    </View>
  );
}

function AlertFormDirection({
  type,
  setType,
}: {
  type: ApiOnchainTokenNotificationType;
  setType: (type: ApiOnchainTokenNotificationType) => void;
}) {
  const t = useTheme();

  const DIRECTION_OPTIONS = [
    {
      id: 'price-movement-pct-up',
      label: 'Up',
      Icon: TrendingUp,
    },
    {
      id: 'price-movement-pct-down',
      label: 'Down',
      Icon: TrendingDown,
    },
    {
      id: 'price-movement-pct',
      label: 'Crosses',
      Icon: TrendingUpDown,
    },
  ] as const;

  return (
    <View style={[{ gap: 12 }]}>
      <Text2 size="sm" color="secondary" weight="semibold">
        Direction
      </Text2>
      <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
        {DIRECTION_OPTIONS.map(({ id, label, Icon }) => (
          <Button
            key={id}
            onPress={() => setType(id)}
            isSelected={type === id}
            label={label}
            Icon={Icon}
          />
        ))}
      </View>
    </View>
  );
}
function AlertFormTargetType({
  type,
  setType,
}: {
  type: ApiOnchainTokenNotificationType;
  setType: (type: ApiOnchainTokenNotificationType) => void;
}) {
  const t = useTheme();

  const DIRECTION_OPTIONS = [
    {
      id: 'price-target-market-cap',
      label: 'Market Cap',
    },
    {
      id: 'price-target',
      label: 'Price',
    },
  ] as const;

  return (
    <View style={[{ gap: 12 }]}>
      <Text2 size="sm" color="secondary" weight="semibold">
        Direction
      </Text2>
      <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
        {DIRECTION_OPTIONS.map(({ id, label }) => (
          <Button
            key={id}
            onPress={() => setType(id)}
            isSelected={type === id}
            label={label}
          />
        ))}
      </View>
    </View>
  );
}

function AlertFormInfo({ type }: { type: ApiOnchainTokenNotificationType }) {
  const t = useTheme();

  const label = React.useMemo(() => {
    switch (type) {
      case 'price-movement-pct-up':
        return 'Alert me when price goes up by this percentage';
      case 'price-movement-pct-down':
        return 'Alert me when price goes down by this percentage';
      case 'price-movement-pct':
        return 'Alert me when price changes by this percentage';
      case 'price-target':
        return 'Alert me when the price reaches this amount';
      case 'price-target-market-cap':
        return 'Alert me when the market cap reaches this amount';
    }
  }, [type]);

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        { borderRadius: 8, gap: 6, paddingHorizontal: 6 },
      ]}
    >
      <Info size={16} color={t.colors.text.informative} />
      <View style={[t.flex1]}>
        <Text2
          color="secondary"
          weight="medium"
          style={{ fontSize: 13 }}
          lineHeight="xs"
        >
          {label}
        </Text2>
      </View>
    </View>
  );
}

function AlertFormPercentChange({
  percentChange,
  setPercentChange,
  isCustom,
  setIsCustom,
}: {
  percentChange: string;
  setPercentChange: (percentChange: string) => void;
  isCustom: boolean;
  setIsCustom: (isCustom: boolean) => void;
}) {
  const t = useTheme();

  const PERCENT_CHANGE_OPTIONS = [
    [
      {
        id: '5',
        label: '5%',
      },
      {
        id: '10',
        label: '10%',
      },

      {
        id: '25',
        label: '25%',
      },
    ],
    [
      {
        id: '50',
        label: '50%',
      },
      {
        id: '100',
        label: '100%',
      },
      {
        id: 'custom' as const,
        label: 'Custom',
      },
    ],
  ];

  const handlePress = (id: 'custom' | string) => {
    setIsCustom(id === 'custom');
    setPercentChange(id === 'custom' ? '' : id);
  };

  const handleCustomChange = (value: string) => {
    if (parseFloat(value) > 1000) {
      return;
    }

    setPercentChange(value);
  };

  return (
    <View style={[{ gap: 12 }]}>
      <Text2 size="sm" color="secondary" weight="semibold">
        Change
      </Text2>
      <View style={[{ gap: 8 }]}>
        {PERCENT_CHANGE_OPTIONS.map((row, index) => (
          <View key={index} style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            {row.map(({ id, label }) => (
              <Button
                key={id}
                isSelected={
                  id === 'custom' ? isCustom : !isCustom && percentChange === id
                }
                onPress={() => handlePress(id)}
                label={label}
              />
            ))}
          </View>
        ))}
      </View>
      {isCustom && (
        <>
          <View
            style={[
              t.bgMuted,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.borderDefault,
              t.border,
              { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
            ]}
          >
            {Platform.OS !== 'web' ? (
              <Text2
                size="lg"
                weight="medium"
                color={percentChange ? 'primary' : 'tertiary'}
              >
                {percentChange || '0'}
              </Text2>
            ) : (
              <TextInput
                style={[
                  t.texts.primary,
                  t.textXl,
                  t.fontMedium,
                  !percentChange ? t.texts.tertiary : t.texts.primary,
                  { maxWidth: 240, paddingRight: 16 },
                ]}
                cursorColor={t.colors.text.tertiary}
                value={percentChange}
                onChangeText={(val) => {
                  if (
                    val &&
                    (Number.isNaN(parseFloat(val)) ||
                      (!/^\d*\.?\d*$/.test(val) && !/^\d*,\d*$/.test(val)))
                  ) {
                    return;
                  }
                  handleCustomChange(val.replace(',', '.'));
                }}
                placeholder="0"
                autoFocus
              />
            )}
            <Text2 size="lg" weight="medium" color="tertiary">
              %
            </Text2>
          </View>
          {Platform.OS !== 'web' && (
            <NumPad
              value={percentChange}
              onChange={handleCustomChange}
              maxDecimals={2}
              onInvalidInput={() => {}}
            />
          )}
        </>
      )}
    </View>
  );
}

function AlertFormPriceTarget({
  priceUsd,
  marketCapUsd,
  priceTarget,
  type,
  setPriceTarget,
}: {
  priceUsd: number;
  marketCapUsd: number;
  priceTarget: string;
  type: ApiOnchainTokenNotificationType;
  setPriceTarget: (priceTarget: string) => void;
}) {
  const t = useTheme();
  const [value, setValue] = React.useState<string>(priceTarget);
  const [adjustment, setAdjustment] = React.useState<number>(0);

  const formatAdjustment = React.useCallback(
    (value: number, adjustment: number) =>
      formatPrice(
        value * (1 + adjustment / 100),
        false,
        type === 'price-target-market-cap' ? 0 : 2,
        false,
      ).replace(/,/g, '.'),
    [type],
  );

  React.useEffect(() => {
    if (type === 'price-target-market-cap') {
      const ratio = parseFloat(priceTarget) / priceUsd;
      const newMarketCapUsd = marketCapUsd * ratio;
      setValue(newMarketCapUsd.toString());
    } else {
      setValue(priceTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, marketCapUsd, priceUsd]);

  React.useEffect(() => {
    if (type === 'price-target-market-cap') {
      const ratio = value ? parseFloat(value) / marketCapUsd : 0;
      const formattedValue = formatPrice(
        priceUsd * ratio,
        false,
        type === 'price-target-market-cap' ? 0 : 2,
        false,
      ).replace(/,/g, '.');

      setPriceTarget(formattedValue || '0');
    } else {
      setPriceTarget(value);
    }
  }, [value, type, marketCapUsd, priceUsd, setPriceTarget]);

  const ADJUSTMENT_OPTIONS = [
    {
      id: -10,
      label: '-10%',
    },
    {
      id: -5,
      label: '-5%',
    },
    {
      id: -1,
      label: '-1%',
    },
    {
      id: 1,
      label: '+1%',
    },

    {
      id: 5,
      label: '+5%',
    },

    {
      id: 10,
      label: '+10%',
    },
  ];

  const handleAdjustment = React.useCallback(
    (id: number) => {
      if (type === 'price-target-market-cap') {
        setValue(formatAdjustment(marketCapUsd, adjustment + id));
      } else {
        setValue(formatAdjustment(priceUsd, adjustment + id));
      }
      setAdjustment((adjustment) => adjustment + id);
    },
    [setValue, formatAdjustment, adjustment, type, marketCapUsd, priceUsd],
  );

  const resetAdjustment = React.useCallback(() => {
    setAdjustment(0);
    if (type === 'price-target-market-cap') {
      setValue(marketCapUsd.toString());
    } else {
      setValue(priceUsd.toString());
    }
  }, [priceUsd, setValue, type, marketCapUsd]);

  const formattedValue = React.useMemo(() => {
    if (type === 'price-target-market-cap') {
      return parseFloat(value || '0').toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        useGrouping: true,
      });
    }
    return value;
  }, [value, type]);

  return (
    <View style={[{ gap: 12 }]}>
      <Text2 size="sm" color="secondary" weight="semibold">
        Amount
      </Text2>
      <View
        style={[
          t.bgMuted,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.borderDefault,
          t.border,
          {
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 6,
            gap: 4,
          },
        ]}
      >
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Text2 size="lg" weight="medium" color="tertiary">
            $
          </Text2>
          {Platform.OS !== 'web' ? (
            <Text2
              size="lg"
              weight="medium"
              color={priceTarget ? 'primary' : 'tertiary'}
            >
              {formattedValue}
            </Text2>
          ) : (
            <TextInput
              style={[
                t.texts.primary,
                t.textXl,
                t.fontMedium,
                !value ? t.texts.tertiary : t.texts.primary,
                { maxWidth: 240, paddingRight: 16 },
              ]}
              cursorColor={t.colors.text.tertiary}
              value={value}
              onChangeText={(val) => {
                if (
                  val &&
                  (Number.isNaN(parseFloat(val)) ||
                    (!/^\d*\.?\d*$/.test(val) && !/^\d*,\d*$/.test(val)))
                ) {
                  return;
                }
                setValue(val.replace(',', '.'));
              }}
              placeholder="0"
              autoFocus
            />
          )}
        </View>
        {adjustment !== 0 && (
          <AnimatedPressable onPress={resetAdjustment}>
            <Text2 size="sm" weight="medium" color="tertiary">
              Reset
            </Text2>
          </AnimatedPressable>
        )}
      </View>
      <View style={[t.flexRow, t.itemsCenter, { gap: 12 }]}>
        {ADJUSTMENT_OPTIONS.map(({ id, label }) => (
          <Button
            key={id}
            label={label}
            onPress={() => handleAdjustment(id)}
            variant="sm"
          />
        ))}
      </View>
      {Platform.OS !== 'web' && (
        <NumPad
          value={value}
          onChange={setValue}
          onInvalidInput={() => {}}
          maxDecimals={type === 'price-target-market-cap' ? 0 : undefined}
        />
      )}
    </View>
  );
}

function Button({
  isSelected,
  onPress,
  Icon,
  label,
  variant = 'default',
}: {
  isSelected?: boolean;
  onPress: () => void;
  Icon?: React.ElementType;
  label: string;
  variant?: 'default' | 'sm';
}) {
  const t = useTheme();
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        variant === 'sm' ? t.pX1 : t.pX3,
        variant === 'sm' ? t.pY1 : t.pY2,
        t.flex1,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        { borderRadius: 8, gap: 8 },
        isSelected ? t.backgrounds.brandLight : t.backgrounds.secondary,
      ]}
    >
      {Icon && (
        <Icon
          size={16}
          color={isSelected ? t.colors.text.brand : t.colors.text.secondary}
        />
      )}
      <Text2
        weight="semibold"
        color={isSelected ? 'brand' : 'secondary'}
        size={variant === 'sm' ? 'xs' : 'base'}
      >
        {label}
      </Text2>
    </AnimatedPressable>
  );
}
