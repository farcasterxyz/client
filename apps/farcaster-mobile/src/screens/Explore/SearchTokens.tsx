import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLink } from 'farcaster-client-data';
import { useNonSuspenseTokenLinks } from 'farcaster-client-hooks';
import {
  FullScreenLoadingIndicator,
  LoadingIndicator,
  tokenLinkToMinimalToken,
  TokenListItem,
  useRecentlySearchedTokens,
  useTheme,
} from 'farcaster-expo';
import React, { FC, useCallback } from 'react';
import { FlatList, View } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { SearchTabProps } from '~/screens/Explore/ExploreScreen';

const SearchTokens: FC<SearchTabProps> = ({ q, enabled }) => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const push = usePush();
  const viewerFid = useCurrentUser_UNSAFE().fid;
  const trimmedQ = q.trim();
  const { data } = useNonSuspenseTokenLinks({
    ticker: trimmedQ,
    contextFid: viewerFid,
    enabled: enabled && trimmedQ.length > 0,
  });
  const { trackRecentlySearchedTokens } = useRecentlySearchedTokens();

  const onSearchedTokenPress = useCallback(
    (item: ApiTokenLink) => {
      trackEvent(AnalyticsEvent.ClickSearchResult, { type: 'token' });

      trackRecentlySearchedTokens([tokenLinkToMinimalToken(item)]);
      push('Token', {
        chain: item.chain,
        ca: item.ca,
        via: 'search_query',
      });
    },
    [push, trackEvent, trackRecentlySearchedTokens],
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiTokenLink }) => {
      return (
        <TokenListItem
          token={item}
          onPress={onSearchedTokenPress}
          variant="search"
        />
      );
    },
    [onSearchedTokenPress],
  );

  if (!enabled) {
    return (
      <View style={[t.hFull, t.mT12]}>
        <LoadingIndicator />
      </View>
    );
  }

  return <FlatList data={data?.tokens} renderItem={renderItem} />;
};

const WrappedSearchTokens: FC<SearchTabProps> = React.memo(({ q, enabled }) => {
  return (
    <React.Suspense fallback={<FullScreenLoadingIndicator />}>
      <SearchTokens q={q} enabled={enabled} />
    </React.Suspense>
  );
});

SearchTokens.displayName = 'TokensSearchTab';

export { WrappedSearchTokens as SearchTokens };
