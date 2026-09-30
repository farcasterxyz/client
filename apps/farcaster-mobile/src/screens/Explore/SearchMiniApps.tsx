import { FlashList } from '@shopify/flash-list';
import { ApiFrame } from 'farcaster-client-data';
import { useSearchMiniApps } from 'farcaster-client-hooks';
import { FullScreenLoadingIndicator, LoadingIndicator } from 'farcaster-expo';
import React, { FC, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { AppListItem } from '~/components/Apps/AppListItem';
import { DefaultEmptyListView } from '~/components/DefaultEmptyListView';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { SearchTabProps } from '~/screens/Explore/ExploreScreen';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const SearchMiniApps: FC<SearchTabProps> = ({ q, enabled }) => {
  const t = useTheme();

  const query = enabled ? q : '';

  const { flatData, onEndReached, isFetching } = useSearchMiniApps({
    query,
  });

  const frames = useMemo(() => flatData ?? [], [flatData]);

  const renderItem = useCallback(
    ({ item }: { item: ApiFrame }) => {
      return (
        <View style={[t.pX3, t.pY2]}>
          <AppListItem frame={item} disableAnimation={true} />
        </View>
      );
    },
    [t.pX3, t.pY2],
  );

  if (!enabled) {
    return (
      <View style={[t.hFull, t.mT12]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (isFetching && frames.length === 0) {
    return <FullScreenLoadingIndicator debugName="SearchMiniApps" />;
  }

  if (frames.length === 0) {
    return (
      <View style={[t.flexGrow]}>
        <DefaultEmptyListView message="No mini apps match your search." />
      </View>
    );
  }

  return (
    <View style={[t.hFull, t.flexCol]}>
      <FlashList
        data={frames}
        keyExtractor={(item: ApiFrame) => item.domain}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: 4 }}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderItem}
      />
    </View>
  );
};

const WrappedSearchMiniApps: FC<SearchTabProps> = React.memo(
  ({ q, enabled }) => {
    return (
      <React.Suspense fallback={<FullScreenLoadingIndicator />}>
        <SearchMiniApps q={q} enabled={enabled} />
      </React.Suspense>
    );
  },
);

SearchMiniApps.displayName = 'SearchMiniApps';

export { WrappedSearchMiniApps as SearchMiniApps };
