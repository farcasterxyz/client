import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  usePurgedFollowing,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FollowsHeader } from '~/components/follows/FollowsHeader';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { User } from '~/components/users/User';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';
import { useUserLevel } from '~/hooks/data/useUserLevel';

type FollowingProps = {
  user: ApiUser;
};

const Following: FC<FollowingProps> = memo(({ user }) => {
  const { data, onEndReached, isFetchingNextPage } = usePurgedFollowing({
    fid: user.fid,
  });

  const users = useMemo(
    () => data!.pages.flatMap((page) => page.result.users),
    [data],
  );

  const userIsProUser = useUserLevel(user) === 'pro';

  return (
    <Page meta={{ title: `Users followed by ${user.displayName}` }}>
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          footer={<FollowsHeader user={user} focusedTab="following" />}
        >
          <PageTitle>
            <BackButton />
            <div className="flex flex-col">
              <UserDisplayNameWithBadges
                user={user}
                style="header"
                Badge={userIsProUser && <FarcasterProBadge size={14} />}
              />
              <span className="text-sm text-muted">
                {resolveUsername({
                  username: user.username,
                  fid: user.fid,
                })}
              </span>
            </div>
          </PageTitle>
        </PageHeader>
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={userKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          emptyView={
            <DefaultEmptyListView
              message={`${user.displayName} isn't following anyone`}
            />
          }
        />
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiUser }) => (
  <User user={item} withDetailsPopover={true} />
);

export { Following };
