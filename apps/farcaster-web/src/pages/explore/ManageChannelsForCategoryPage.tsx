import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel, ApiUserChannelsCategory } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  useUserChannelsForCategory,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useEffect } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChannelForCategory } from '~/components/channelsV3/ChannelForCategory';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { Link } from '~/components/links/Link';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { PillTab } from '~/components/tabs/PillTab';
import { PillTabs } from '~/components/tabs/PillTabs';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useParams } from '~/hooks/navigation/useParams';

const manageChannelsForCategoryTabs = [
  { id: 'moderate', name: 'Moderator' },
  { id: 'member', name: 'Member' },
  { id: 'follow', name: 'Follower' },
];

const ManageChannelsForCategoryPage: FC = () => {
  const { trackEvent } = useAnalytics();

  const isSignedIn = useIsSignedIn();

  const { category } = useParams('manageChannelsCategory');

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewManageChannelsCategory, { category });
  }, [category, trackEvent]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <Page meta={{ title: `Farcaster / Channels` }}>
      <BorderedMainContent>
        <PageHeader
          footer={
            <PillTabs>
              {manageChannelsForCategoryTabs.map((tab) => (
                <Link
                  to="manageChannelsCategory"
                  key={tab.id}
                  title={tab.name}
                  params={{ category: tab.id }}
                  searchParams={{}}
                >
                  <PillTab isFocused={category === tab.id}>{tab.name}</PillTab>
                </Link>
              ))}
            </PillTabs>
          }
        >
          <PageTitle>
            <BackButton />
            Manage channels
          </PageTitle>
        </PageHeader>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <ManageChannelsForCategoryPageContent
            key={category}
            category={category}
          />
        </Suspense>
      </BorderedMainContent>
    </Page>
  );
};

ManageChannelsForCategoryPage.displayName = 'ManageChannelsForCategoryPage';

type ManageChannelsForCategoryPageContentProps = {
  category: ApiUserChannelsCategory;
};

const ManageChannelsForCategoryPageContent: FC<ManageChannelsForCategoryPageContentProps> =
  memo(({ category }) => {
    const { fid: currentUserFid } = useCurrentUser();

    const {
      flatData: channels,
      onEndReached,
      isFetchingNextPage,
    } = useUserChannelsForCategory({ fid: currentUserFid, category });

    const renderItem = React.useCallback(
      ({ item }: { item: ApiChannel }) => {
        return <ChannelForCategory channel={item} category={category} />;
      },
      [category],
    );

    return (
      <FlatList
        data={channels}
        renderItem={renderItem}
        keyExtractor={channelKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        emptyView={<></>}
      />
    );
  });

ManageChannelsForCategoryPageContent.displayName =
  'ManageChannelsForCategoryPageContent';

export { ManageChannelsForCategoryPage };
