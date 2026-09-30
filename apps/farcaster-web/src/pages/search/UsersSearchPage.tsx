import { ApiUser } from 'farcaster-client-data';
import {
  EventingProvider,
  useFlatSearchUsersData,
  userKeyExtractor,
  useSearchUsers,
} from 'farcaster-client-hooks';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { EmptySearchResultsListView } from '~/components/lists/EmptySearchResultsListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { SearchHeader } from '~/components/search/SearchHeader';
import { User } from '~/components/users/User';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

import { SearchPageHeader } from './SearchPageHeader';

const UsersSearchPage = memo(() => {
  const { q } = useSearchParams('searchUsers');
  const navigate = useNavigate();

  const trimmedQ = useMemo(() => {
    return q?.trim();
  }, [q]);

  useEffect(() => {
    if (!trimmedQ) {
      navigate({ to: 'users', params: {}, searchParams: {} });
    }
  }, [navigate, trimmedQ]);

  if (!trimmedQ) {
    return null;
  }

  return <UsersSearchPageContent q={trimmedQ} />;
});

UsersSearchPage.displayName = 'UsersUsersSearchPage';

type UsersSearchPageContentProps = {
  q: string;
};

const UsersSearchPageContent: FC<UsersSearchPageContentProps> = memo(
  ({ q }) => {
    return (
      <Page meta={{ title: 'Search / Farcaster' }}>
        <BorderedMainContent>
          <PageHeader
            footer={<SearchPageHeader focusedTab="users" q={q} />}
            hideCastButton={true}
          >
            <SearchHeader q={q} showClearIcon={false} focusedTab={'users'} />
          </PageHeader>
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <UserSearchResults q={q} />
          </Suspense>
        </BorderedMainContent>
      </Page>
    );
  },
);

const renderUserItem = ({ item }: { item: ApiUser }) => <User user={item} />;

UsersSearchPageContent.displayName = 'UsersSearchPageContent';

type SearchResultsProps = {
  q: string;
};

const UserSearchResults: FC<SearchResultsProps> = memo(({ q }) => {
  const { data, onEndReached, isFetchingNextPage } = useSearchUsers({ q });
  const users = useFlatSearchUsersData({ data });

  if (!users) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <EventingProvider on="search-users">
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={userKeyExtractor}
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

UserSearchResults.displayName = 'UserSearchResults';

export { UsersSearchPage };
