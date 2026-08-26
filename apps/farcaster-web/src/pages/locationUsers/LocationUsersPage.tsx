import { ApiUser } from 'farcaster-client-data';
import { useLocationUsers, userKeyExtractor } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { User } from '~/components/users/User';
import { useParams } from '~/hooks/navigation/useParams';

const LocationUsersPage: FC = memo(() => {
  const { placeId } = useParams('locationUsers');

  const { data, onEndReached, isFetchingNextPage } = useLocationUsers({
    placeId,
  });

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.result.users) || [],
    [data],
  );

  const title = useMemo(
    () =>
      users.length ? users[0].profile.location?.description : 'Nearby Users',
    [users],
  );

  return (
    <Page meta={{ title: `Farcaster / ${title}` }}>
      <BorderedMainContent>
        <PageHeader>
          <PageTitle>
            <BackButton />
            {title}
          </PageTitle>
        </PageHeader>
        <DebugLogger name="Location Users" data={users} position="top-left" />
        <FlatList
          data={users}
          emptyView={
            <DefaultEmptyListView message="Could not find any notifications" />
          }
          renderItem={renderItem}
          keyExtractor={userKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
        />
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiUser }) => <User user={item} />;

LocationUsersPage.displayName = 'LocationUsersPage';

export { LocationUsersPage };
