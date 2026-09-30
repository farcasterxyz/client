import { ApiChannel } from 'farcaster-client-data';
import {
  useFeedItems,
  useOgFeedItems,
  useRefreshFeedItemsFirstPage,
  useSetFeedItemsAsSeenIfPrefetched,
} from 'farcaster-client-hooks';
import React, { memo, useCallback } from 'react';

import { Cast } from '~/components/casts/Cast';
import { FlatList } from '~/components/lists/FlatList';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useSetOnCurrentNavLinkClicked } from '~/hooks/data/useSetOnCurrentNavLinkClicked';
import { ApiCastWithContext } from '~/types';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

import { EmptyChannelPageContent } from './EmptyChannelPageContent';

interface FeedProps {
  feed: ApiChannel;
  feedType: string;
}

const Feed: React.FC<FeedProps> = memo(({ feed, feedType }) => {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return <AuthenticatedFeed feed={feed} feedType={feedType} />;
  }
  return <PublicFeed feed={feed} feedType={feedType} />;
});

const AuthenticatedFeed: React.FC<FeedProps> = memo(({ feed, feedType }) => {
  const onNullFeedItemsResponse = useCallback(() => {
    // FIXME: Fill this out if we notice issues on web clients similar to Web
  }, []);

  const { feedItems, refetch, onEndReached, isFetchingNextPage } = useFeedItems(
    {
      feedKey: feed.key,
      feedType,
      // User is immediately seeing this content, so mark the feed as seen with the API request
      // This prevents a separate /feed-seen request
      updateState: true,
      onNullFeedItemsResponse,
    },
  );

  const refreshFirstPage = useRefreshFeedItemsFirstPage(
    feed.key,
    feedType,
    refetch,
  );
  useSetOnCurrentNavLinkClicked(refreshFirstPage);

  useSetFeedItemsAsSeenIfPrefetched({
    feedKey: feed.key,
    feedType,
  });

  const castsWithContext = React.useMemo(
    () => buildCastsWithContext(feedItems, { showChannelTag: false }),
    [feedItems],
  );

  return (
    <FlatList
      data={castsWithContext}
      emptyView={<EmptyChannelPageContent channel={feed} feedType={feedType} />}
      renderItem={renderItem}
      keyExtractor={castWithContextKeyExtractor}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
});

const PublicFeed: React.FC<FeedProps> = memo(({ feed, feedType }) => {
  const { data } = useOgFeedItems({ feedKey: feed.key });

  const castsWithContext = React.useMemo(
    () => buildCastsWithContext(data?.items ?? [], { showChannelTag: false }),
    [data?.items],
  );

  return (
    <FlatList
      data={castsWithContext}
      emptyView={<EmptyChannelPageContent channel={feed} feedType={feedType} />}
      renderItem={renderItem}
      keyExtractor={castWithContextKeyExtractor}
    />
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

Feed.displayName = 'Feed';
AuthenticatedFeed.displayName = 'AuthenticatedFeed';
PublicFeed.displayName = 'PublicFeed';
export { Feed };
