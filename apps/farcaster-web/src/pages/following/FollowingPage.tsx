import {
  EventingProvider,
  useFeedItems,
  useRefreshFeedItemsFirstPage,
} from 'farcaster-client-hooks';
import { FC, memo, Suspense, useCallback, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import {
  FeedHeader,
  FOLLOWING_CHANNEL_KEY,
} from '~/components/feeds/FeedHeader';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useHomeLastSelectedTab } from '~/contexts/HomeLastSelectedTabProvider';
import { useSetOnCurrentNavLinkClicked } from '~/hooks/data/useSetOnCurrentNavLinkClicked';
import { ApiCastWithContext } from '~/types';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const FollowingPage: FC = () => {
  const { defaultFeed } = useHomeLastSelectedTab();

  return (
    <Page meta={{ title: 'Farcaster / Following' }}>
      <BorderedMainContent>
        <PageHeader
          footer={<FeedHeader defaultFeedTab={defaultFeed} tab="following" />}
        >
          <PageTitle>Following</PageTitle>
        </PageHeader>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <FollowingPageContent />
        </Suspense>
      </BorderedMainContent>
    </Page>
  );
};

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

const FollowingPageContent: FC = memo(() => {
  const onNullFeedItemsResponse = useCallback(() => {
    // FIXME: Fill this out if we notice issues on web clients similar to Web
  }, []);

  const { feedItems, onEndReached, isFetchingNextPage, refetch } = useFeedItems(
    {
      feedKey: FOLLOWING_CHANNEL_KEY,
      feedType: 'default',
      updateState: true,
      onNullFeedItemsResponse: onNullFeedItemsResponse,
      sortMode: { type: 'reverse-chron' },
    },
  );

  const castsWithContext = useMemo(
    () => buildCastsWithContext(feedItems),
    [feedItems],
  );

  const refreshFirstPage = useRefreshFeedItemsFirstPage(
    'home',
    'default',
    refetch,
  );

  useSetOnCurrentNavLinkClicked(refreshFirstPage);

  return (
    <EventingProvider on="following" key={FOLLOWING_CHANNEL_KEY}>
      <FlatList
        data={castsWithContext}
        emptyView={<DefaultEmptyListView message="Nothing to see here. 🌳" />}
        renderItem={renderItem}
        keyExtractor={castWithContextKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </EventingProvider>
  );
});

FollowingPage.displayName = 'FollowingPage';

export { FollowingPage };
