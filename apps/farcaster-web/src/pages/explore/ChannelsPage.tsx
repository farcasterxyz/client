import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  EventingProvider,
  useDiscoverChannels,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Channel } from '~/components/channels/Channel';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

import { ExplorePageHeader } from './ExplorePageHeader';

const ChannelsPage: FC = () => {
  const { trackEvent } = useAnalytics();

  const isSignedIn = useIsSignedIn();

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewAllChannels, undefined);
  }, [trackEvent]);

  return (
    <Page meta={{ title: `Farcaster / Channels` }}>
      <BorderedMainContent>
        <PageHeader
          footer={
            isSignedIn ? <ExplorePageHeader focusedTab="channels" /> : undefined
          }
        >
          <PageTitle>{isSignedIn ? 'Explore' : 'Explore Channels'}</PageTitle>
        </PageHeader>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <ChannelsPageContent />
        </Suspense>
      </BorderedMainContent>
    </Page>
  );
};

const renderItem = ({ item }: { item: ApiChannel }) => (
  <Channel channel={item} />
);

ChannelsPage.displayName = 'ChannelsPage';

const ChannelsPageContent: FC = memo(() => {
  const { data, onEndReached, isFetchingNextPage } = useDiscoverChannels();

  const channels = useMemo(
    () =>
      data!.pages
        .flatMap((page) => page.result.channels)
        .filter((channel) => channel.type === 'channel'),
    [data],
  );

  return (
    <EventingProvider on="explore-channels">
      <FlatList
        data={channels}
        renderItem={renderItem}
        keyExtractor={channelKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        emptyView={<></>}
      />
    </EventingProvider>
  );
});

ChannelsPageContent.displayName = 'ChannelsPageContent';

export { ChannelsPage };
