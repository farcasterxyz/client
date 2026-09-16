import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ApiCast,
  ApiChain,
  apiChainToChainIdOrThrow,
  ApiTokenEmbedFeedType,
  ApiTokenHolder,
  ApiTokenLink,
  ApiUser,
  isNativeAsset,
  isUsdc,
} from 'farcaster-client-data';
import {
  formatShorthandNumber,
  MILLIS_PER_SECOND,
  useTokenFeed,
  useTokenHolders,
} from 'farcaster-client-hooks';
import {
  Check,
  ChevronLeft,
  Clock,
  ListFilter,
  Repeat,
  X,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { AnimatedRef, useSharedValue } from 'react-native-reanimated';

import { useSharedNavigationContext } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useHaptics,
  usePullToRefreshInfinite,
  useWalletShowTokenCastsCta,
} from '../../../hooks';
import { useCachedOrQueryToken } from '../../../hooks/useCachedOrQueryToken';
import { useTokenBalance } from '../../../hooks/useTokenBalance';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import { AnimatedPressable } from '../../design-system';
import { Text2 } from '../../design-system/Text';
import { WalletTokenIntents } from '../../wallet/tokens/WalletTokenIntents';
import { TokenChart } from './charts/TokenChart';
import { TokenAbout } from './TokenAbout';
import { TokenUserActivityBottomSheetModal } from './TokenActivity';
import { TokenBalance } from './TokenBalance';
import { TokenCast } from './TokenCast';
import { TokenHeader } from './TokenHeader';
import { TokenHolder } from './TokenHolders';
import { TokenListItemPlaceholder } from './TokenListItem';

type TokenProps = {
  chain: ApiChain;
  ca: string;
  onLinkPress?: ({ target }: { target: string }) => void;
  onUserPress?: ({
    fid,
    initialTab,
  }: {
    fid: number;
    initialTab?: 'tokens';
  }) => void;
  onImagePress?: (url: string) => void;
  showIntents?: boolean;
  imageRef?: AnimatedRef<View>;
  imageStyle?: StyleProp<ViewStyle>;
  hideAdminFeatures?: boolean;
  showTokenWarnings?: boolean;
  CastComponent?: React.ComponentType<{ cast: ApiCast; token: ApiTokenLink }>;
  onCreateCastPress?: () => void;
};

export function Token({
  chain,
  ca,
  onLinkPress,
  onUserPress,
  onImagePress,
  showIntents = true,
  imageRef,
  imageStyle,
  hideAdminFeatures = false,
  showTokenWarnings = false,
  CastComponent,
  onCreateCastPress,
}: TokenProps) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const { goBack, push } = useSharedNavigationContext();

  const [tab, setTab] = React.useState<'casts' | 'holders' | 'about'>();

  const { data: token } = useCachedOrQueryToken({
    chain,
    ca,
    query: { staleTime: 15 * MILLIS_PER_SECOND },
  });

  const { data: balance } = useTokenBalance({ chain, ca, onchain: false });

  const [showUserActivitySheet, setShowUserActivitySheet] =
    React.useState<ApiUser | null>(null);

  const {
    data: holdersData,
    fetchNextPage: fetchHoldersNextPage,
    fetchPreviousPage: fetchHoldersPreviousPage,
    hasNextPage: holdersHasNextPage,
    isFetchingNextPage: holdersIsFetchingNextPage,
    isPending: holdersIsPending,
    isError: holdersIsError,
  } = useTokenHolders({ chain, ca });

  const [showTokenCastsTypeFilterSheet, setShowTokenCastsTypeFilterSheet] =
    React.useState(false);

  const [tokenCastsTypeFilter, setTokenCastsTypeFilter] =
    React.useState<ApiTokenEmbedFeedType>('recommended');

  const {
    data: casts,
    fetchNextPage: fetchCastsNextPage,
    fetchPreviousPage: fetchCastsPreviousPage,
    hasNextPage: castsHasNextPage,
    isFetchingNextPage: castsIsFetchingNextPage,
    isPending: castsIsPending,
    isError: castsIsError,
  } = useTokenFeed({
    chain,
    ca,
    feedType: tokenCastsTypeFilter,
  });

  const {
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useMemo(() => {
    if (tab === 'casts') {
      return {
        fetchNextPage: fetchCastsNextPage,
        fetchPreviousPage: fetchCastsPreviousPage,
        hasNextPage: castsHasNextPage,
        isFetchingNextPage: castsIsFetchingNextPage,
        isPending: castsIsPending,
        isError: castsIsError,
      };
    }

    if (tab === 'holders') {
      return {
        fetchNextPage: fetchHoldersNextPage,
        fetchPreviousPage: fetchHoldersPreviousPage,
        hasNextPage: holdersHasNextPage,
        isFetchingNextPage: holdersIsFetchingNextPage,
        isPending: holdersIsPending,
        isError: holdersIsError,
      };
    }

    return {
      fetchNextPage: () => {},
      fetchPreviousPage: () => {},
      hasNextPage: false,
      isFetchingNextPage: false,
      isPending: false,
      isError: false,
    };
  }, [
    tab,
    fetchCastsNextPage,
    fetchCastsPreviousPage,
    castsHasNextPage,
    castsIsFetchingNextPage,
    castsIsPending,
    castsIsError,
    fetchHoldersNextPage,
    fetchHoldersPreviousPage,
    holdersHasNextPage,
    holdersIsFetchingNextPage,
    holdersIsPending,
    holdersIsError,
  ]);

  const allCasts = React.useMemo(() => {
    return casts?.pages.flatMap((page) => page.result.casts) ?? [];
  }, [casts]);

  const holders = holdersData?.holders;
  const totalHolders = holdersData?.totalHolders;

  const data = React.useMemo(() => {
    if (!token) {
      return [];
    }

    if (tab === 'about') {
      return [{ type: 'about' as const }];
    }

    if (tab === 'casts') {
      return allCasts.map((cast) => ({ type: 'cast' as const, cast }));
    }

    if (tab === 'holders') {
      return holders
        ? holders.map((holder) => ({
            type: 'holder' as const,
            holder,
          }))
        : [];
    }

    return [];
  }, [allCasts, holders, tab, token]);

  React.useEffect(() => {
    if (castsIsPending || !!tab) {
      return;
    }

    if (allCasts.length > 0 && balance) {
      setTab('casts');
    } else {
      setTab('about');
    }
  }, [allCasts.length, castsIsPending, tab, balance]);

  const animationEnabled = useSharedValue(true);

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      animationEnabled.value = event.nativeEvent.contentOffset.y < 100;
    },
    [animationEnabled],
  );

  const handleFilterPress = React.useCallback(() => {
    if (tab === 'casts') {
      setShowTokenCastsTypeFilterSheet(true);
    }
  }, [tab, setShowTokenCastsTypeFilterSheet]);

  const FilterButton = React.useMemo(() => {
    return (
      <AnimatedPressable
        style={[
          t.border,
          t.borders.secondary,
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: t.borderRadiuses.$12, width: 30, height: 30 },
        ]}
        onPress={handleFilterPress}
      >
        <ListFilter color={t.colors.text.secondary} size={16} />
      </AnimatedPressable>
    );
  }, [
    t.colors.text.secondary,
    t.border,
    t.borders.secondary,
    t.itemsCenter,
    t.justifyCenter,
    t.borderRadiuses.$12,
    handleFilterPress,
  ]);

  const ListHeaderComponent = React.useMemo(() => {
    const onBalancePress = () => {
      if (!token) return;
      triggerImpactAsync();
      push({ path: 'TokenActivity', params: { ...token } });
    };

    return (
      <>
        <View style={[{ gap: 24 }]}>
          <TokenChart
            // undefined for self viewer
            fid={undefined}
            chain={chain}
            ca={ca}
            animationEnabled={animationEnabled}
            withinNavigationContext={true}
          />
          {token && <TokenBalance token={token} onPress={onBalancePress} />}
        </View>
        {!!tab && (
          <View
            style={[t.flexRow, t.justifyBetween, t.itemsCenter, t.p4, t.pB2]}
          >
            <TokenTabs
              token={token}
              setTab={setTab}
              tab={tab}
              totalHolders={totalHolders}
            />
            {tab === 'casts' && FilterButton}
          </View>
        )}
      </>
    );
  }, [
    animationEnabled,
    chain,
    ca,
    token,
    setTab,
    tab,
    t,
    totalHolders,
    FilterButton,
    push,
    triggerImpactAsync,
  ]);

  const ListFooterComponent = React.useMemo(() => {
    if (isFetchingNextPage) {
      return <TokenListItemPlaceholder hideValue avatarSize={38} />;
    }

    return null;
  }, [isFetchingNextPage]);

  const renderItem: ListRenderItem<
    | { type: 'about' }
    | { type: 'cast'; cast: ApiCast }
    | { type: 'holder'; holder: ApiTokenHolder }
  > = React.useCallback(
    ({ item }) => {
      if (!token || !tab) {
        return null;
      }

      if (item.type === 'about') {
        return (
          <TokenAbout
            token={token}
            onUserPress={onUserPress}
            onLinkPress={onLinkPress}
          />
        );
      }

      if (item.type === 'holder') {
        const holderUserPress = () => {
          if (!item.holder.user || !onUserPress) {
            return;
          }

          triggerImpactAsync();
          setShowUserActivitySheet(item.holder.user);
        };

        return (
          <TokenHolder
            token={token}
            holder={item.holder}
            onUserPress={holderUserPress}
          />
        );
      }

      const Component = CastComponent ?? TokenCast;
      return (
        <>
          <Component cast={item.cast} token={token} />
        </>
      );
    },
    [CastComponent, onLinkPress, onUserPress, tab, token, triggerImpactAsync],
  );

  const keyExtractor = React.useCallback(
    (
      item:
        | { type: 'about' }
        | { type: 'cast'; cast: ApiCast }
        | { type: 'holder'; holder: ApiTokenHolder },
    ) => {
      if (item.type === 'cast') return item.cast.hash;
      if (item.type === 'holder') return item.holder.address;
      return item.type;
    },
    [],
  );

  const onEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListEmptyComponent = React.useMemo(() => {
    if (!tab || tab === 'about') {
      return null;
    }

    if (isPending) {
      return (
        <View>
          {[...Array(5)].map((_, idx) => (
            <TokenListItemPlaceholder key={idx} hideValue avatarSize={38} />
          ))}
        </View>
      );
    }

    if (isError) {
      const label = tab === 'casts' ? 'casts' : 'holders';
      return (
        <View
          style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 8 }]}
        >
          <Clock size={24} style={t.texts.tertiary} />
          <Text2 color="secondary" align="center">
            It's taking a little longer than usual to load {label}. Please check
            back shortly.
          </Text2>
        </View>
      );
    }

    if (tab === 'holders') {
      return (
        <View
          style={[t.flex1, t.itemsCenter, t.justifyCenter, t.p4, { gap: 8 }]}
        >
          <Text2 color="secondary" align="center">
            No token holders found.
          </Text2>
        </View>
      );
    }

    if (tab === 'casts') {
      return <CtaBanner token={token} />;
    }

    return null;
  }, [isPending, isError, tab, t, token]);

  const pullToRefresh = React.useCallback(async () => {
    await fetchPreviousPage();
  }, [fetchPreviousPage]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch: pullToRefresh,
    offset: 72,
  });

  return (
    <View style={[t.flex1]}>
      <FlashList
        data={data}
        renderItem={renderItem}
        extraData={token}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingTop: 64, paddingBottom: 96 }}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={refreshControl}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
      {showIntents && (
        <WalletTokenIntents
          chain={chain}
          ca={ca}
          showTokenWarnings={showTokenWarnings}
          onCreateCastPress={onCreateCastPress}
        />
      )}
      <LinearGradient
        colors={[t.colors.background.default, t.colors.bgTransparent]}
        locations={[0.8, 1]}
        style={[
          t.absolute,
          t.top0,
          t.flexRow,
          t.itemsCenter,
          t.pT2,
          t.pB5,
          t.pX2,
          { gap: 4, width: '100%' },
          Platform.OS === 'web' && t.mT0,
        ]}
      >
        <AnimatedPressable
          onPress={() => {
            triggerImpactAsync();
            goBack();
          }}
          style={[t.p1, t.roundedFull, t.backgrounds.default]}
        >
          <ChevronLeft size={24} style={t.texts.primary} />
        </AnimatedPressable>
        <TokenHeader
          token={token}
          balance={balance}
          onImagePress={onImagePress}
          imageRef={imageRef}
          imageStyle={imageStyle}
          hideAdminFeatures={hideAdminFeatures}
        />
      </LinearGradient>
      {showTokenCastsTypeFilterSheet && (
        <TokenCastsTypeFilterSheet
          onDismiss={() => setShowTokenCastsTypeFilterSheet(false)}
          tokenCastsTypeFilter={tokenCastsTypeFilter}
          setTokenCastsTypeFilter={setTokenCastsTypeFilter}
        />
      )}
      {showUserActivitySheet && token && (
        <TokenUserActivityBottomSheetModal
          user={showUserActivitySheet}
          token={token}
          onDismiss={() => setShowUserActivitySheet(null)}
          onUserPress={({ fid }) =>
            onUserPress?.({ fid, initialTab: 'tokens' })
          }
        />
      )}
    </View>
  );
}

function TokenTabs({
  token,
  setTab,
  tab,
  totalHolders,
}: {
  token?: ApiTokenLink;
  setTab: (tab: 'casts' | 'holders' | 'about') => void;
  tab: 'casts' | 'holders' | 'about';
  totalHolders?: number;
}) {
  const t = useTheme();
  const tabs = useMemo(() => {
    const defaultTabs = [
      {
        label: 'About',
        value: 'about',
      },
      {
        label: 'Casts',
        value: 'casts',
      },
    ];

    // Don't show holders for native assets
    if (isNativeAsset(token?.ca) || isUsdc(token?.ca)) {
      return defaultTabs;
    }

    if (!token?.chain) {
      return defaultTabs;
    }

    return [
      ...defaultTabs,
      {
        label: `Holders${!totalHolders ? '' : ` (${formatShorthandNumber(totalHolders)})`}`,
        value: 'holders',
      },
    ];
  }, [token?.chain, token?.ca, totalHolders]);

  return (
    <View
      style={[
        t.flexRow,
        t.pY3,
        t.bgDefault,
        { paddingBottom: 6, gap: 12, zIndex: 11 },
      ]}
    >
      {tabs.map((item) => (
        <AnimatedPressable
          key={item.value}
          onPress={() => setTab(item.value as 'casts' | 'holders' | 'about')}
        >
          <Text2
            weight="semibold"
            size="lg"
            color={tab === item.value ? 'primary' : 'tertiary'}
          >
            {item.label}
          </Text2>
        </AnimatedPressable>
      ))}
    </View>
  );
}

function CtaBanner({
  token,
  dismissable,
}: {
  token?: ApiTokenLink;
  dismissable?: boolean;
}) {
  const t = useTheme();
  const [dismissed = false, setDismissed] = useWalletShowTokenCastsCta();
  const { push } = useSharedNavigationContext();

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
  }, [setDismissed]);

  const handlePress = React.useCallback(() => {
    if (!token) {
      return;
    }

    push({
      path: 'WalletSwap',
      params: {
        platformType: 'mobile',
        swapIntent: {
          buy: {
            address: token.ca,
            chainId: Number(apiChainToChainIdOrThrow(token.chain)),
          },
        },
      },
    });
  }, [push, token]);

  if (dismissable && dismissed) {
    return null;
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.p3,
        t.border,
        t.borders.primary,
        t.mX3,
        t.mY2,
        { borderRadius: t.borderRadiuses.$20 },
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <Repeat size={20} color={t.colors.text.secondary} />
        <View style={[t.flexCol, { gap: 2 }]}>
          <Text2 weight="medium" color="secondary" size="sm">
            {dismissable
              ? 'Cast about this token'
              : 'Be the first to cast here.'}
          </Text2>
          <Text2 weight="medium" color="tertiary" size="xs">
            Trade at least $10 to share your thoughts.
          </Text2>
        </View>
      </View>
      {dismissable && (
        <AnimatedPressable onPress={handleDismiss}>
          <X size={16} color={t.colors.text.tertiary} strokeWidth={2.5} />
        </AnimatedPressable>
      )}
    </AnimatedPressable>
  );
}

function TokenCastsTypeFilterSheet({
  onDismiss,
  tokenCastsTypeFilter,
  setTokenCastsTypeFilter,
}: {
  onDismiss: () => void;
  tokenCastsTypeFilter: ApiTokenEmbedFeedType;
  setTokenCastsTypeFilter: (
    tokenCastsTypeFilter: ApiTokenEmbedFeedType,
  ) => void;
}) {
  const t = useTheme();

  const setFilter = React.useCallback(
    (tokenCastsTypeFilter: ApiTokenEmbedFeedType) => {
      setTokenCastsTypeFilter(tokenCastsTypeFilter);
      onDismiss();
    },
    [setTokenCastsTypeFilter, onDismiss],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="token-casts-type-filter"
      onDismiss={onDismiss}
      handleStyle={{ display: 'none' }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 16,
      }}
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2 weight="semibold" size="xl">
          Filter
        </Text2>
        <AnimatedPressable
          onPress={onDismiss}
          style={[
            t.itemsCenter,
            t.justifyCenter,
            t.backgrounds.secondary,
            t.roundedFull,
            { width: 24, height: 24 },
          ]}
        >
          <X size={16} color={t.colors.text.secondary} strokeWidth={2.5} />
        </AnimatedPressable>
      </View>
      <View
        style={[
          t.overflowHidden,
          { borderRadius: t.borderRadiuses.$12, gap: 1 },
        ]}
      >
        <TouchableOpacity
          onPress={() => setFilter('recommended')}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.backgrounds.secondary,
            { paddingHorizontal: 16, paddingVertical: 12 },
          ]}
        >
          <Text2 weight="medium">Recommended</Text2>
          {tokenCastsTypeFilter === 'recommended' && (
            <Check size={16} color={t.colors.text.success} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.backgrounds.secondary,
            { paddingHorizontal: 16, paddingVertical: 12 },
          ]}
        >
          <Text2 weight="medium">All</Text2>
          {tokenCastsTypeFilter === 'all' && (
            <Check size={16} color={t.colors.text.success} />
          )}
        </TouchableOpacity>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
