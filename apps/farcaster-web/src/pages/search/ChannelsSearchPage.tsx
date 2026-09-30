import { ApiChannel } from 'farcaster-client-data';
import {
  channelKeyExtractor,
  EventingProvider,
  useFlatSearchChannelsData,
  useSearchChannels,
} from 'farcaster-client-hooks';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Channel } from '~/components/channels/Channel';
import { EmptySearchResultsListView } from '~/components/lists/EmptySearchResultsListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { SearchHeader } from '~/components/search/SearchHeader';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

import { SearchPageHeader } from './SearchPageHeader';

const ChannelsSearchPage = memo(() => {
  const { q } = useSearchParams('searchChannels');
  const navigate = useNavigate();

  const trimmedQ = useMemo(() => {
    return q?.trim();
  }, [q]);

  useEffect(() => {
    if (!trimmedQ) {
      navigate({ to: 'channels', params: {}, searchParams: {} });
    }
  }, [navigate, trimmedQ]);

  if (!trimmedQ) {
    return null;
  }

  return <ChannelsSearchPageContent q={trimmedQ} />;
});

ChannelsSearchPage.displayName = 'ChannelsSearchPage';

type ChannelsSearchPageContentProps = {
  q: string;
};

const ChannelsSearchPageContent: FC<ChannelsSearchPageContentProps> = memo(
  ({ q }) => {
    return (
      <Page meta={{ title: 'Search / Farcaster' }}>
        <BorderedMainContent>
          <PageHeader
            footer={<SearchPageHeader focusedTab="channels" q={q} />}
            hideCastButton={true}
          >
            <SearchHeader q={q} showClearIcon={false} focusedTab="channels" />
          </PageHeader>
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <ChannelSearchResults q={q} />
          </Suspense>
        </BorderedMainContent>
      </Page>
    );
  },
);

const renderChannelItem = ({ item }: { item: ApiChannel }) => (
  <Channel channel={item} />
);

ChannelsSearchPageContent.displayName = 'ChannelsSearchPageContent';

type SearchResultsProps = {
  q: string;
};

const ChannelSearchResults: FC<SearchResultsProps> = memo(({ q }) => {
  const { data, onEndReached, isFetchingNextPage } = useSearchChannels({ q });
  const channels = useFlatSearchChannelsData({ data });

  if (!channels) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <EventingProvider on="search-channels">
      <FlatList
        data={channels}
        renderItem={renderChannelItem}
        keyExtractor={channelKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
        emptyView={
          <EmptySearchResultsListView
            message={`We couldn't find any matches for your search`}
          />
        }
      />
    </EventingProvider>
  );
});

ChannelSearchResults.displayName = 'ChannelSearchResults';

export { ChannelsSearchPage };
