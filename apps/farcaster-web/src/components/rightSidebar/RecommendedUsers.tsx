import { ApiUser } from 'farcaster-client-data';
import {
  EventingProvider,
  userKeyExtractor,
  useSuggestedUsers,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useMemo } from 'react';

import { Link } from '~/components/links/Link';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { User } from '~/components/users/User';

const limit = 3;

const RecommendedUsersResults: FC = memo(() => {
  const { data } = useSuggestedUsers({ limit, randomized: true });

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.result.users),
    [data],
  );

  return (
    <EventingProvider on="suggested-users">
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={userKeyExtractor}
        emptyView={
          <DefaultEmptyListView
            className="!bg-transparent"
            message="No suggestions available"
          />
        }
      />
      {users && users.length > 0 && (
        <Link
          title="Show more"
          to="users"
          params={{}}
          searchParams={{}}
          className="block px-2 pt-1 text-sm"
        >
          Show more
        </Link>
      )}
    </EventingProvider>
  );
});

const renderItem = ({ item }: { item: ApiUser }) => (
  <User
    compact
    user={item}
    className="border-none"
    withDetailsPopover={true}
    followStyle="inverted"
    showFollowButtonOnlyIfUnfollowed={true}
  />
);

const RecommendedUsers: FC = memo(() => {
  return (
    <Suspense>
      <div className="mt-3 hidden rounded-lg px-2 py-3 pt-1.5 bg-overlay-light mdlg:block">
        <div className="px-2 py-1 text-lg font-semibold">Suggested Follows</div>
        <RecommendedUsersResults />
      </div>
    </Suspense>
  );
});

RecommendedUsers.displayName = 'RecommendedUsers';

export { RecommendedUsers };
