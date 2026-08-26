import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  EventingProvider,
  usePurgedSuggestedUsers,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
// eslint-disable-next-line no-restricted-imports
import { ExplorePageHeader } from '~/pages/explore/ExplorePageHeader';
const UsersForYou: FC = memo(() => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewSuggestedUsers, undefined);
  }, [trackEvent]);

  return (
    <Page meta={{ title: `Farcaster / Users` }}>
      <BorderedMainContent>
        <PageHeader footer={<ExplorePageHeader focusedTab="forYou" />}>
          <PageTitle>Explore</PageTitle>
        </PageHeader>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <UsersForYouContent />
        </Suspense>
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiUser }) => (
  <User user={item} withDetailsPopover={true} />
);

UsersForYou.displayName = 'UsersForYou';

const UsersForYouContent: FC = memo(() => {
  const { data, onEndReached, isFetchingNextPage } = usePurgedSuggestedUsers({
    randomized: false,
  });

  const users = useMemo(
    () => data!.pages.flatMap((page) => page.result.users),
    [data],
  );

  return (
    <EventingProvider on="explore-users">
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={userKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        emptyView={
          <DefaultEmptyListView
            message={`You are following all suggested users! 🎉`}
          />
        }
      />
    </EventingProvider>
  );
});

UsersForYouContent.displayName = 'UsersForYouContent';

export { UsersForYou };
