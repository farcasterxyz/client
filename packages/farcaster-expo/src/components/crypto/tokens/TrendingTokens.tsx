import { FlashList } from '@shopify/flash-list';
import {
  ApiGetTrendingTokensQueryParams,
  ApiTokenLink,
  ApiTrendingToken,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  formatTokenStat,
  useTrendingTokens,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import { ActivityIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSharedTelemetry, useTheme } from '../../../contexts';
import { useHaptics } from '../../../hooks';
import {
  FullScreenLoadingIndicator,
  Text2,
  TypographyBody,
} from '../../design-system';
import { TokenListItem, TokenListItemPlaceholder } from './TokenListItem';

type StickyHeaderItem = { type: 'sticky-header' };
type TokenItem = { type: 'token'; data: ApiTrendingToken };
type LoadingItem = { type: 'loading' };
type ListItem = StickyHeaderItem | TokenItem | LoadingItem;

export function TrendingTokens({
  enabled,
  onPress,
  onRefresh,
  onScroll,
  query,
  params,
  emptyComponent,
  ListHeaderComponent,
  stickyHeaderComponent,
  pulseFeedVersion,
  tokenFilter,
}: {
  enabled: boolean;
  onPress: (token: ApiTokenLink) => void;
  onRefresh?: () => Promise<void>;
  onScroll?: () => void;
  query?: string;
  params?: Omit<ApiGetTrendingTokensQueryParams, 'cursor' | 'limit'>;
  emptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  stickyHeaderComponent?: React.ReactElement;
  pulseFeedVersion?: boolean;
  tokenFilter?: (token: ApiTokenLink) => boolean;
}) {
  if (!enabled) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <TrendingTokensList
      onPress={onPress}
      onRefresh={onRefresh}
      onScroll={onScroll}
      query={query}
      params={params}
      emptyComponent={emptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      stickyHeaderComponent={stickyHeaderComponent}
      pulseFeedVersion={pulseFeedVersion}
      tokenFilter={tokenFilter}
    />
  );
}

function TrendingTokensList({
  onPress,
  onRefresh,
  onScroll,
  query,
  params,
  emptyComponent,
  ListHeaderComponent,
  stickyHeaderComponent,
  pulseFeedVersion,
  tokenFilter,
}: {
  onPress: (token: ApiTokenLink) => void;
  onRefresh?: () => Promise<void>;
  onScroll?: () => void;
  query?: string;
  params?: Omit<ApiGetTrendingTokensQueryParams, 'cursor' | 'limit'>;
  emptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  stickyHeaderComponent?: React.ReactElement;
  pulseFeedVersion?: boolean;
  tokenFilter?: (token: ApiTokenLink) => boolean;
}) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const {
    data,
    isPending,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useTrendingTokens(params);

  // Flatten all pages into a single array
  const allTokens = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) {
      return [];
    }

    const all = data.pages.flatMap((page) => page?.tokens ?? []);

    return uniqBy(all, (item) => item.token.ca.toLowerCase());
  }, [data]);

  const paginatedTokens = useMemo(() => {
    let tokens = allTokens;
    if (tokenFilter) {
      tokens = tokens.filter((token) => tokenFilter(token.token));
    }
    if (query) {
      tokens = tokens.filter(
        (token) =>
          token.token.name?.toLowerCase().includes(query.toLowerCase()) ||
          token.token.ticker?.toLowerCase().includes(query.toLowerCase()),
      );
    }
    return tokens;
  }, [allTokens, query, tokenFilter]);

  const listData: ListItem[] = useMemo(() => {
    const tokenItems: TokenItem[] = paginatedTokens.map((token) => ({
      type: 'token',
      data: token,
    }));

    const list: ListItem[] = [];
    if (stickyHeaderComponent) {
      list.push({ type: 'sticky-header' });
    }

    if (isPending) {
      Array.from({ length: 5 }).forEach(() => list.push({ type: 'loading' }));
    } else {
      list.push(...tokenItems);
    }

    return list;
  }, [paginatedTokens, stickyHeaderComponent, isPending]);

  const stickyHeaderIndices = useMemo(() => {
    return stickyHeaderComponent ? [0] : undefined;
  }, [stickyHeaderComponent]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'sticky-header') {
        return stickyHeaderComponent ?? null;
      }
      if (item.type === 'loading') {
        return <TokenListItemPlaceholder />;
      }

      const token = item.data;

      const subtitleComponent =
        params?.sortBy === 'vol' ? (
          // volume-only subtitle
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <ActivityIcon size={12} color={t.colors.text.secondary} />
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              {`Vol. ${formatTokenStat(token.buys.volume + token.sells.volume)}`}
            </Text2>
          </View>
        ) : pulseFeedVersion ? (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <TypographyBody
              label={'Medium/Strong'}
              color="tertiary"
            >{`${formatTokenStat(token.buys.volume + token.sells.volume)} vol`}</TypographyBody>
            {params?.sortBy === 'new' &&
              typeof token.token.source?.createdAt !== 'undefined' && (
                <TypographyBody label={'Medium/Strong'} color="tertiary">
                  ∙ {formatTimeAgo(token.token.source?.createdAt)}
                </TypographyBody>
              )}
          </View>
        ) : undefined;

      const hideChain = pulseFeedVersion;

      const variant = pulseFeedVersion ? 'pulse' : undefined;

      return (
        <TokenListItem
          token={token.token}
          onPress={onPress}
          subtitleComponent={subtitleComponent}
          hideChain={hideChain}
          variant={variant}
        />
      );
    },
    [
      onPress,
      params?.sortBy,
      pulseFeedVersion,
      stickyHeaderComponent,
      t.colors.text.secondary,
      t.flexRow,
      t.itemsCenter,
    ],
  );

  const ListFooterComponent = useMemo(() => {
    if (isFetchingNextPage) {
      return <TokenListItemPlaceholder />;
    }
    return null;
  }, [isFetchingNextPage]);

  const ListEmptyComponent = useMemo(() => {
    if (isPending) {
      return (
        <View>
          {Array.from({ length: 5 }).map((_, idx) => (
            <TokenListItemPlaceholder key={idx} />
          ))}
        </View>
      );
    }

    return emptyComponent ?? null;
  }, [isPending, emptyComponent]);

  const { triggerImpactAsync } = useHaptics();
  const [refreshing, setRefreshing] = useState(false);
  const { trackError } = useSharedTelemetry();

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      triggerImpactAsync();
      await Promise.all([await refetch(), await onRefresh?.()]);
    } catch (e) {
      trackError(e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, onRefresh, triggerImpactAsync, trackError]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: ListItem, idx: number) => {
    if (item.type === 'sticky-header') {
      return 'sticky-header';
    }
    if (item.type === 'loading') {
      return `loading-${idx}`;
    }
    return item.data.token.ca;
  }, []);

  const getItemType = useCallback((item: ListItem) => {
    return item.type;
  }, []);

  return (
    <FlashList
      data={listData}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      stickyHeaderIndices={stickyHeaderIndices}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onScroll={onScroll}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    />
  );
}
