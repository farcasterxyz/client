import { FlashList } from '@shopify/flash-list';
import { ApiChannel } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  EventingProvider,
  useFlatSearchChannelsData,
  useSearchChannels,
} from 'farcaster-client-hooks';
import React, { FC, useCallback } from 'react';
import { View } from 'react-native';

import { ChannelSearchItem } from '~/components/channels/ChannelSearchItem';
import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { SearchTabProps } from '~/screens/Explore/ExploreScreen';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const LIST_BATCH_SIZE = 10;

const SearchChannels: FC<SearchTabProps> = ({ q, enabled }) => {
  const t = useTheme();

  const { data, fetchNextPage, hasNextPage } = useSearchChannels({ q });
  const channels = useFlatSearchChannelsData({ data });

  const { displayedItems: displayedChannels, handleEndReached } =
    useDisplayLimit({
      data: channels ?? [],
      batchSize: LIST_BATCH_SIZE,
      hasNextPage: hasNextPage ?? false,
      fetchNextPage,
    });

  const renderItem = useCallback(({ item }: { item: ApiChannel }) => {
    return <ChannelSearchItem channel={item} showBio />;
  }, []);

  if (!channels || !enabled) {
    return (
      <View style={[t.hFull, t.mT12]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (channels.length === 0) {
    return (
      <View style={[t.flexGrow]}>
        <Empty message={'No channels match your query.'} />
      </View>
    );
  }

  return (
    <EventingProvider on="search-channels">
      <View style={[t.hFull, t.flexCol]}>
        <FlashList
          data={displayedChannels}
          keyExtractor={channelKeyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          keyboardShouldPersistTaps="handled"
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={renderItem}
          ListFooterComponent={
            hasNextPage ? (
              <View style={[t.h24, t.mT4]}>
                <LoadingIndicator />
              </View>
            ) : null
          }
        />
      </View>
    </EventingProvider>
  );
};

const WrappedSearchChannels: FC<SearchTabProps> = React.memo(
  ({ q, enabled }) => {
    return (
      <React.Suspense fallback={<FullScreenLoadingIndicator />}>
        <SearchChannels q={q} enabled={enabled} />
      </React.Suspense>
    );
  },
);

SearchChannels.displayName = 'ChannelsSearchTab';
export { WrappedSearchChannels as SearchChannels };
