import { ApiChannel } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  EventingProvider,
  useSuggestedChannels,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useMemo } from 'react';

import { Channel } from '~/components/channels/Channel';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';

const limit = 3;

const RecommendedChannelsResults: FC<{ channelKey?: string }> = memo(
  ({ channelKey }) => {
    const { data } = useSuggestedChannels({
      limit,
      currentChannelKey: channelKey,
    });

    const channels = useMemo(
      () => data?.pages.flatMap((page) => page.result.channels),
      [data],
    );

    return (
      <EventingProvider on="suggested-channels">
        <FlatList
          data={channels}
          renderItem={renderItem}
          keyExtractor={channelKeyExtractor}
          emptyView={
            <DefaultEmptyListView
              className="!bg-transparent"
              message="No suggestions available"
            />
          }
        />
      </EventingProvider>
    );
  },
);

const renderItem = ({ item }: { item: ApiChannel }) => (
  <Channel
    channel={item}
    hideDescription={true}
    className="border-none"
    style="suggestion"
  />
);

const RecommendedChannels: FC<{ channelKey?: string }> = memo(
  ({ channelKey }) => {
    return (
      <Suspense>
        <div className="mt-3 hidden rounded-lg px-2 py-3 pt-1.5 bg-overlay-light mdlg:block">
          <div className="px-2 py-1 text-lg font-semibold">
            {channelKey ? 'Similar Channels' : 'Suggested Channels'}
          </div>
          <RecommendedChannelsResults channelKey={channelKey} />
        </div>
      </Suspense>
    );
  },
);

RecommendedChannels.displayName = 'RecommendedChannels';

export { RecommendedChannels };
