import {
  ApiCast,
  ApiChannel,
  ApiFrame,
  ApiUser,
  isFarcasterApiError,
} from 'farcaster-client-data';
import {
  channelKeyExtractor,
  useFlatSearchCastsData,
  useFlatSearchChannelsData,
  useFlatSearchUsersData,
  userKeyExtractor,
  useSearchCasts,
  useSearchChannels,
  useSearchMiniApps,
  useSearchUsers,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { Channel } from '~/components/channels/Channel';
import { EmptySearchResultsListView } from '~/components/lists/EmptySearchResultsListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { MiniAppListItem } from '~/components/miniApp/MiniAppLeaderboardListItem';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { SearchHeader } from '~/components/search/SearchHeader';
import { User } from '~/components/users/User';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

import { SearchPageHeader } from './SearchPageHeader';

const NUM_USERS_TO_SHOW = 2;
const NUM_CHANNELS_TO_SHOW = 2;
const NUM_MINI_APPS_TO_SHOW = 3;

const TopSearchPage = memo(() => {
  const { q } = useSearchParams('top');
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

  return <TopSearchPageContent q={trimmedQ} />;
});

TopSearchPage.displayName = 'TopSearchPage';

type TopSearchPageContentProps = {
  q: string;
};

const TopSearchPageContent: FC<TopSearchPageContentProps> = memo(({ q }) => {
  return (
    <Page meta={{ title: 'Search / Farcaster' }}>
      <BorderedMainContent>
        <PageHeader
          footer={<SearchPageHeader focusedTab="top" q={q} />}
          hideCastButton={true}
        >
          <SearchHeader
            q={q}
            showFilterIcon={true}
            showClearIcon={false}
            focusedTab={'top'}
          />
        </PageHeader>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <TopSearchResults q={q} />
        </Suspense>
      </BorderedMainContent>
    </Page>
  );
});

const renderCastItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

const renderUserItem = ({ item }: { item: ApiUser }) => (
  <User user={item} showBottomBorder={false} />
);

const renderChannelItem = ({ item }: { item: ApiChannel }) => (
  <Channel channel={item} showBottomBorder={false} />
);

TopSearchPageContent.displayName = 'TopSearchPageContent';

type SearchResultsProps = {
  q: string;
};

const TopSearchResults: FC<SearchResultsProps> = memo(({ q }) => {
  const navigate = useNavigate();
  const { data: userData, isFetching: isFetchingUsers } = useSearchUsers({
    q,
    limit: NUM_USERS_TO_SHOW,
  });
  const users = useFlatSearchUsersData({ data: userData });
  const { data: channelData, isFetching: isFetchingChannels } =
    useSearchChannels({ q, limit: NUM_CHANNELS_TO_SHOW });
  const channels = useFlatSearchChannelsData({ data: channelData });
  const {
    data: castData,
    onEndReached: onEndCastsReached,
    isFetchingNextPage: isFetchingNextCastsPage,
    isFetching: isFetchingCasts,
    error,
  } = useSearchCasts({ q });
  const casts = useFlatSearchCastsData({ data: castData });
  const castsWithContext = useCastsWithContext(casts || ([] as ApiCast[]), {
    forceThreadPosition: 'start_and_end',
    forceCastHeaderLabelHidden: true,
  });
  const { flatData: miniApps, isFetching: isFetchingMiniApps } =
    useSearchMiniApps({ query: q, limit: NUM_MINI_APPS_TO_SHOW });

  const uniqueCastsWithContext = useMemo(
    () => uniqBy(castsWithContext, castWithContextKeyExtractor),
    [castsWithContext],
  );

  const { message: errMessage, subMessage: errSubMessage } =
    fetchEmptyViewMessage(error);

  if (
    isFetchingUsers ||
    isFetchingCasts ||
    isFetchingChannels ||
    isFetchingMiniApps
  ) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <>
      {users && users.length > 0 && (
        <>
          <div className="py-4 pl-4 text-xl font-semibold border-faint">
            Users
          </div>
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={userKeyExtractor}
            emptyView={
              <EmptySearchResultsListView
                message={errMessage}
                subMessage={errSubMessage}
              />
            }
          />
          <div
            className="border-b py-4 pl-4 border-faint text-link hover:cursor-pointer hover:underline"
            onClick={() =>
              navigate({
                to: 'searchUsers',
                params: {},
                searchParams: { q: q },
              })
            }
          >
            View all
          </div>
        </>
      )}
      {channels && channels.length > 0 && (
        <>
          <div className="py-4 pl-4 text-xl font-semibold border-faint">
            Channels
          </div>
          <FlatList
            data={channels}
            renderItem={renderChannelItem}
            keyExtractor={channelKeyExtractor}
            emptyView={
              <EmptySearchResultsListView
                message={errMessage}
                subMessage={errSubMessage}
              />
            }
          />
          <div
            className="border-b py-4 pl-4 border-faint text-link hover:cursor-pointer hover:underline"
            onClick={() =>
              navigate({
                to: 'searchChannels',
                params: {},
                searchParams: { q: q },
              })
            }
          >
            View all
          </div>
        </>
      )}
      {miniApps && miniApps.length > 0 && (
        <>
          <div className="py-4 pl-4 text-xl font-semibold border-faint">
            Mini Apps
          </div>
          <FlatList
            data={miniApps.slice(0, NUM_MINI_APPS_TO_SHOW)}
            renderItem={({ item }: { item: ApiFrame }) => (
              <MiniAppListItem item={item} />
            )}
            keyExtractor={(item: ApiFrame) => item.domain}
            emptyView={<EmptySearchResultsListView message={errMessage} />}
          />
          <div
            className="border-b py-4 pl-4 border-faint text-link hover:cursor-pointer hover:underline"
            onClick={() =>
              navigate({
                to: 'searchMiniApps',
                params: {},
                searchParams: { q: q },
              })
            }
          >
            View all
          </div>
        </>
      )}
      {uniqueCastsWithContext.length > 0 && (
        <>
          <div className="py-4 pl-4 text-xl font-semibold border-faint">
            Casts
          </div>
          <FlatList
            data={uniqueCastsWithContext}
            renderItem={renderCastItem}
            keyExtractor={castWithContextKeyExtractor}
            emptyView={
              <EmptySearchResultsListView
                message={errMessage}
                subMessage={errSubMessage}
              />
            }
            onEndReached={onEndCastsReached}
            isFetchingNextPage={isFetchingNextCastsPage}
          />
        </>
      )}
      {uniqueCastsWithContext.length === 0 &&
        (!users || users.length === 0) &&
        (!channels || channels.length === 0) &&
        (!miniApps || miniApps.length === 0) && (
          <EmptySearchResultsListView
            message={errMessage}
            subMessage={errSubMessage}
          />
        )}
    </>
  );
});

const fetchEmptyViewMessage = (
  error: unknown,
): { message: string; subMessage?: string } => {
  const defaultMessage = {
    message: "We couldn't find any matches for your search",
  };

  if (error && isFarcasterApiError(error)) {
    //@ts-ignore
    const errorMessage = error.responseData.errors[0].message ?? '';
    if (errorMessage.endsWith('not found')) {
      const errorComponents = errorMessage.split(' ');
      const searchTerm = errorComponents[0];
      return {
        message: `We couldn't find a ${searchTerm.toLowerCase()} named ${
          searchTerm === 'Channel' ? '/' : '@'
        }${errorComponents[1].toLowerCase()}`,
        subMessage: `Make sure everything is spelled correctly or try a different ${searchTerm.toLowerCase()}`,
      };
    } else {
      return defaultMessage;
    }
  }

  return defaultMessage;
};
TopSearchResults.displayName = 'TopSearchResults';

export { TopSearchPage };
