import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiCast } from 'farcaster-client-data';
import { useFlatSearchCastsData, useSearchCasts } from 'farcaster-client-hooks';
import React, { FC } from 'react';
import { View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { SearchTabProps } from '~/screens/Explore/ExploreScreen';
import { extractCastKey } from '~/utils/CastUtils';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import { ZERO_SCROLL_INSET_PROPS } from '~/utils/ScrollInsetUtils';

const LIST_BATCH_SIZE = 5;

const renderCast: ListRenderItem<ApiCast> = ({ item }) => {
  return <Cast cast={item} />;
};

const SearchCasts: FC<SearchTabProps> = ({ q, enabled }) => {
  const t = useTheme();
  const recentQ = q
    ? `${q.startsWith('$') ? `ticker:${q.slice(1)}` : q} sort:recent`
    : '';
  const {
    data: castData,
    fetchNextPage,
    hasNextPage,
  } = useSearchCasts({
    q: recentQ,
    limit: 10,
  });
  const casts = useFlatSearchCastsData({ data: castData });

  const { displayedItems: displayedCasts, handleEndReached } = useDisplayLimit({
    data: casts ?? [],
    batchSize: LIST_BATCH_SIZE,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
  });

  if (!casts || !enabled) {
    return (
      <View style={[t.hFull, t.mT12]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (casts.length === 0) {
    return (
      <View style={[t.flexGrow]}>
        <Empty message={'No results match your query.'} />
      </View>
    );
  }

  return (
    <View style={[t.flex1]}>
      <FlashList
        data={displayedCasts}
        renderItem={renderCast}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        {...ZERO_SCROLL_INSET_PROPS}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          hasNextPage ? (
            <View style={[t.h24, t.mT4]}>
              <LoadingIndicator />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const WrappedSearchCasts: FC<SearchTabProps> = React.memo(({ q, enabled }) => {
  return (
    <React.Suspense fallback={<FullScreenLoadingIndicator />}>
      <SearchCasts q={q} enabled={enabled} />
    </React.Suspense>
  );
});

SearchCasts.displayName = 'SearchCasts';

export { WrappedSearchCasts as SearchCasts };
