import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiTokenLink,
  ApiTrendingToken,
  ApiTrendingTokensSortBy,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  formatTokenStat,
  useExploreFeed,
  useNonSuspenseTokenWatchlists,
  usePrefetchTrendingTokens,
  useTrendingTokens,
  useUnseen,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  hitSlopSm,
  ScreenTitle,
  Text2,
  TokenListItem,
  TokenListItemPlaceholder,
  TypographyBody,
  useHaptics,
  usePullToRefreshInfinite,
} from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import { Coins, ListFilterIcon, StarIcon } from 'lucide-react-native';
import React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useMMKVString } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { topBarHeight } from '~/components/CollapsibleTab/FeedTopBar';
import { ArticlesCarousel } from '~/components/News/ArticleCarousel';
import { useTopBar } from '~/components/TopBar';
import { TrendingTokensFiltersBottomSheetModal } from '~/components/TrendingTokens/TrendingTokensFiltersBottomSheet';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import {
  TrendingTokensFilters,
  useTrendingTokensFilters,
} from '~/hooks/useTrendingTokensFilters';
import { openedExploreTab } from '~/utils/FastStorageUtils';

type PulseFeedItem =
  | { type: 'trending'; token: ApiTrendingToken }
  | { type: 'watchlist'; token: ApiTokenLink }
  | { type: 'loading' };

export function PulseFeed({
  embedded,
  ListHeaderPrepend,
  onScroll: onScrollProp,
  onLayout,
  contentOffset,
}: {
  embedded?: boolean;
  ListHeaderPrepend?: React.ReactNode;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout?: () => void;
  contentOffset?: { x: number; y: number };
} = {}) {
  const { fid } = useCurrentUser_UNSAFE();

  const t = useTheme();

  const insets = useSafeAreaInsets();

  const push = usePush();

  const { trackEvent } = useAnalytics();

  const { recordAllArticlesSeen } = useUnseen();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewPulseFeed, undefined);

      openedExploreTab({ fid });

      recordAllArticlesSeen();
    }, [fid, recordAllArticlesSeen, trackEvent]),
  );

  const { triggerImpactAsync } = useHaptics();

  const [showTrendingFiltersBottomSheet, setShowTrendingFiltersBottomSheet] =
    React.useState(false);

  const [pulseTab, setPulseTab] = useMMKVString('pulse-tab');

  const trendingFilters = useTrendingTokensFilters('trending-pulse', {
    sortBy: pulseTab === 'recent' ? 'new' : 'trending-pulse',
  });

  const trendingFiltersForRecentPrefetch = useTrendingTokensFilters(
    'trending-pulse',
    { sortBy: 'new' },
  );

  const prefetchTrendingTokensRecent = usePrefetchTrendingTokens();

  const prefetchRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (!prefetchRef.current) {
      prefetchTrendingTokensRecent({
        params: trendingFiltersForRecentPrefetch.params,
      });

      prefetchRef.current = true;
    }

    return () => {
      prefetchRef.current = false;
    };
  }, [prefetchTrendingTokensRecent, trendingFiltersForRecentPrefetch.params]);

  const title = React.useMemo(() => <ScreenTitle title="Pulse" />, []);

  const { topBar } = useTopBar({
    title,
  });

  const watchlistActive = pulseTab === 'watchlist';

  const onWatchlistPress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PulseFeedWatchlistPress, {});
    setPulseTab('watchlist');
    trendingFilters.resetSortBy();
  }, [trackEvent, trendingFilters, triggerImpactAsync, setPulseTab]);

  const onFilterPress = React.useCallback(
    ({ sortBy }: { sortBy: ApiTrendingTokensSortBy }) => {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.PulseFeedFilterPress, { sortBy });
      trendingFilters.setSelectedSortBy(sortBy);
      setPulseTab(sortBy === 'new' ? 'recent' : 'trending');
    },
    [trackEvent, trendingFilters, triggerImpactAsync, setPulseTab],
  );

  const { data, refetch: refetchExploreFeed } = useExploreFeed();

  const {
    data: trendingData,
    isPending: isTrendingPending,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchTrendingTokens,
  } = useTrendingTokens(trendingFilters.params);

  const {
    data: watchlists,
    isPending: isWatchlistsPending,
    onEndReached: onWatchlistEndReached,
    refetch: refetchTokenWatchlists,
  } = useNonSuspenseTokenWatchlists();

  const refetch = React.useCallback(async () => {
    await Promise.all([
      await refetchExploreFeed(),
      await refetchTrendingTokens(),
      await refetchTokenWatchlists(),
    ]);
  }, [refetchExploreFeed, refetchTokenWatchlists, refetchTrendingTokens]);

  const articles = React.useMemo(() => {
    return typeof data.feed.news !== 'undefined' && data.feed.news.length !== 0
      ? data.feed.news
      : undefined;
  }, [data.feed.news]);

  // includes a sort by
  const totalFilterCount = React.useMemo(() => {
    const { filterCount, params } = trendingFilters;
    return (
      filterCount +
      (params.sortBy !== 'trending-pulse' && params.sortBy !== 'new' ? 1 : 0)
    );
  }, [trendingFilters]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <View
        style={[
          t.flex,
          t.flexCol,
          t.gap3,
          !embedded && { marginTop: topBarHeight },
        ]}
      >
        {ListHeaderPrepend}
        {typeof articles !== 'undefined' && (
          <View style={[t.flex, t.pX3, t.pT3]}>
            <ArticlesCarousel articles={articles} />
          </View>
        )}
        <View
          style={[
            t.flexCol,
            t.pX3,
            {
              paddingVertical: 6,
            },
          ]}
        >
          <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
            <SortOptions
              filters={trendingFilters}
              watchlistActive={watchlistActive}
              onWatchlistPress={onWatchlistPress}
              onFilterPress={onFilterPress}
            />
            <AnimatedPressable
              onPress={() => setShowTrendingFiltersBottomSheet(true)}
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyCenter,
                t.pX3,
                t.h8,
                t.border,
                { borderRadius: 16 },
                totalFilterCount > 0
                  ? [t.backgrounds.brandLight, t.borders.highlight]
                  : [t.backgrounds.default, t.borders.secondary],
              ]}
            >
              <ListFilterIcon
                size={16}
                style={totalFilterCount > 0 ? t.texts.brand : t.texts.secondary}
              />
              {totalFilterCount > 0 && (
                <View
                  style={[
                    t.absolute,
                    t.flexCol,
                    t.roundedFull,
                    t.justifyCenter,
                    t.itemsCenter,
                    t.w4,
                    t.h4,
                    t.backgrounds.brand,
                    { top: -4, right: -5 },
                  ]}
                >
                  <Text2
                    style={[
                      t.texts.light,
                      t.fontBold,
                      { fontSize: 8, lineHeight: 12 },
                    ]}
                  >
                    {totalFilterCount}
                  </Text2>
                </View>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </View>
    );
  }, [
    t,
    totalFilterCount,
    articles,
    onFilterPress,
    onWatchlistPress,
    trendingFilters,
    watchlistActive,
    embedded,
    ListHeaderPrepend,
  ]);

  const trendingTokens = React.useMemo(() => {
    if (!trendingData?.pages || trendingData.pages.length === 0) {
      return [];
    }

    const allTokens =
      trendingData.pages.flatMap((page) => page?.tokens ?? []) ?? [];

    return uniqBy(allTokens, (item) => item.token.ca.toLowerCase());
  }, [trendingData]);

  const watchlistTokens = React.useMemo(() => {
    return watchlists?.pages.flatMap((o) => o.result.tokens) || [];
  }, [watchlists?.pages]);

  const loadingItems = React.useMemo(
    () =>
      Array.from({ length: 5 }).map(
        () =>
          ({
            type: 'loading',
          }) as const,
      ),
    [],
  );

  const listData: PulseFeedItem[] = React.useMemo(() => {
    if (watchlistActive) {
      if (isWatchlistsPending) {
        return loadingItems;
      }

      return watchlistTokens.map((token) => ({
        type: 'watchlist' as const,
        token,
      }));
    }

    if (isTrendingPending) {
      return loadingItems;
    }

    return trendingTokens.map((token) => ({
      type: 'trending' as const,
      token,
    }));
  }, [
    isTrendingPending,
    isWatchlistsPending,
    loadingItems,
    trendingTokens,
    watchlistActive,
    watchlistTokens,
  ]);

  const extraData = useCommonFlatListExtraData();

  const onTrendingTokenPress = React.useCallback(
    (token: ApiTrendingToken) => {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.ViewToken, {
        chain: token.token.chain,
        ca: token.token.ca,
      });

      push('Token', {
        chain: token.token.chain,
        ca: token.token.ca,
        via: 'trending',
      });
    },
    [push, trackEvent, triggerImpactAsync],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: PulseFeedItem }) => {
      if (item.type === 'loading') {
        return <TokenListItemPlaceholder />;
      }

      if (item.type === 'watchlist') {
        const token = item.token;
        const subtitleComponent = (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <TypographyBody
              label={'Medium/Strong'}
              color="tertiary"
            >{`${formatTokenStat(token.marketCap)} MCAP`}</TypographyBody>
          </View>
        );

        return (
          <TokenListItem
            token={token}
            variant="pulse"
            subtitleComponent={subtitleComponent}
            hideChain={true}
            onPress={() => {
              triggerImpactAsync();

              push('Token', {
                ca: token.ca,
                chain: token.chain,
                via: 'token-watchlists',
              });
            }}
          />
        );
      }

      const token = item.token;
      const subtitleComponent = (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <TypographyBody
            label={'Medium/Strong'}
            color="tertiary"
          >{`${formatTokenStat(token.buys.volume + token.sells.volume)} vol`}</TypographyBody>
          {trendingFilters.params.sortBy === 'new' &&
            typeof token.token.source?.createdAt !== 'undefined' && (
              <TypographyBody label={'Medium/Strong'} color="tertiary">
                ∙ {formatTimeAgo(token.token.source?.createdAt)}
              </TypographyBody>
            )}
        </View>
      );

      return (
        <TokenListItem
          token={token.token}
          variant="pulse"
          subtitleComponent={subtitleComponent}
          hideChain={true}
          onPress={() => onTrendingTokenPress(token)}
        />
      );
    },
    [
      onTrendingTokenPress,
      push,
      t.flexRow,
      t.itemsCenter,
      trendingFilters.params.sortBy,
      triggerImpactAsync,
    ],
  );

  const ListEmptyComponent = React.useMemo(() => {
    if (watchlistActive && !isWatchlistsPending) {
      return (
        <View style={[t.itemsCenter, t.justifyCenter, t.wFull, t.pY4]}>
          <TypographyBody label={'Medium'} color="tertiary">
            Your watchlist is empty
          </TypographyBody>
        </View>
      );
    }

    return (
      <View style={[t.flex1, t.itemsCenter, t.pT6, { gap: 24 }]}>
        <Coins size={64} color={t.colors.background.tertiary} />
        <View style={[t.flex1, t.itemsCenter, { gap: 4 }]}>
          <Text2 size="sm" weight="semibold" color="tertiary">
            No tokens found
          </Text2>
          <AnimatedPressable
            onPress={() => {
              trendingFilters.resetFilters();
              trendingFilters.resetSortBy();
            }}
          >
            <Text2 style={[t.textXs, t.fontSemibold, t.texts.brand]}>
              Remove filters
            </Text2>
          </AnimatedPressable>
        </View>
      </View>
    );
  }, [t, trendingFilters, isWatchlistsPending, watchlistActive]);

  const ListFooterComponent = React.useMemo(() => {
    if (!watchlistActive && isFetchingNextPage) {
      return <TokenListItemPlaceholder />;
    }

    return null;
  }, [isFetchingNextPage, watchlistActive]);

  const onEndReached = React.useCallback(() => {
    if (watchlistActive) {
      onWatchlistEndReached?.();
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onWatchlistEndReached,
    watchlistActive,
  ]);

  const keyExtractor = React.useCallback(
    (item: PulseFeedItem, idx: number) => {
      if (item.type === 'loading') {
        return `loading-${watchlistActive ? 'watchlist' : 'trending'}-${idx}`;
      }

      if (item.type === 'watchlist') {
        return `watchlist-${item.token.chain}-${item.token.ca}`;
      }

      return `trending-${item.token.token.chain}-${item.token.token.ca}`;
    },
    [watchlistActive],
  );

  const { refreshControl } = usePullToRefreshInfinite({
    refetch,
    offset: embedded ? 0 : topBarHeight,
  });

  const scrollRef = React.useRef<Animated.FlatList<PulseFeedItem[]>>(null);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation
        .getParent()
        // @ts-ignore
        ?.addListener('tabPress', () => {
          scrollRef.current?.scrollToOffset({ offset: 0 });
        });

      return unsubscribe;
    }, [navigation]),
  );

  return (
    <View style={[t.flexCol, t.flex1]}>
      {!embedded && topBar}
      <Animated.FlatList
        ref={scrollRef}
        data={listData}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
        }}
        refreshControl={refreshControl}
        onScroll={onScrollProp}
        onLayout={onLayout}
        contentOffset={contentOffset}
        scrollEventThrottle={onScrollProp ? 16 : undefined}
      />
      {showTrendingFiltersBottomSheet && (
        <TrendingTokensFiltersBottomSheetModal
          showSortOptions={false}
          defaultSortBy="trending-pulse"
          onDismiss={() => setShowTrendingFiltersBottomSheet(false)}
          filters={trendingFilters}
        />
      )}
    </View>
  );
}

function SortOptions({
  filters,
  onFilterPress,
  watchlistActive,
  onWatchlistPress,
}: {
  filters: TrendingTokensFilters;
  onFilterPress: ({ sortBy }: { sortBy: ApiTrendingTokensSortBy }) => void;
  watchlistActive: boolean;
  onWatchlistPress: () => void;
}) {
  const t = useTheme();

  const options = [
    { label: 'Trending', sortBy: 'trending-pulse' },
    { label: 'Recent', sortBy: 'new' },
  ] as const;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[t.itemsCenter, t.flexRow, { gap: 8 }]}
    >
      <AnimatedPressable
        onPress={onWatchlistPress}
        disabled={watchlistActive}
        disableAnimation={watchlistActive}
        style={[
          t.pX3,
          t.border,
          t.h8,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: 16 },
          watchlistActive
            ? [t.backgrounds.brandLight, t.borders.highlight]
            : [t.backgrounds.default, t.borders.secondary],
        ]}
        hitSlop={hitSlopSm}
      >
        <StarIcon
          size={16}
          color={
            watchlistActive
              ? t.colors.background.brand
              : t.colors.text.secondary
          }
          fill={
            watchlistActive ? t.colors.text.brand : t.colors.background.default
          }
        />
      </AnimatedPressable>
      {options.map((option) => {
        const activeOption =
          !watchlistActive && filters.params.sortBy === option.sortBy;

        return (
          <AnimatedPressable
            key={option.label}
            disabled={activeOption}
            disableAnimation={activeOption}
            onPress={() => onFilterPress({ sortBy: option.sortBy })}
            style={[
              t.pX3,
              t.border,
              t.h8,
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              { borderRadius: 16 },
              activeOption
                ? [t.backgrounds.brandLight, t.borders.highlight]
                : [t.backgrounds.default, t.borders.secondary],
            ]}
            hitSlop={hitSlopSm}
          >
            <Text2
              size="sm"
              color={activeOption ? 'brand' : 'secondary'}
              weight="medium"
            >
              {option.label}
            </Text2>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}
