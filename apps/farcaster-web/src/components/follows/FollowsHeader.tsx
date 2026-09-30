import { ApiUser } from 'farcaster-client-data';
import {
  usePrefetchFollowers,
  usePrefetchFollowersYouKnow,
  usePrefetchFollowing,
} from 'farcaster-client-hooks';
import { FC, memo, useEffect } from 'react';

import { LinkToFollowers } from '~/components/links/LinkToFollowers';
import { LinkToFollowersYouKnow } from '~/components/links/LinkToFollowersYouKnow';
import { LinkToFollowing } from '~/components/links/LinkToFollowing';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { FollowsTab } from '~/types';

type FollowsHeaderProps = {
  focusedTab: FollowsTab;
  user: ApiUser;
};

const FollowsHeader: FC<FollowsHeaderProps> = memo(({ focusedTab, user }) => {
  const cachedCurrentUser = useCachedCurrentUser();

  const prefetchFollowersYouKnow = usePrefetchFollowersYouKnow();
  const prefetchFollowers = usePrefetchFollowers();
  const prefetchFollowing = usePrefetchFollowing();

  useEffect(() => {
    prefetchFollowersYouKnow({ fid: user.fid, limit: 20 });
    prefetchFollowers({ fid: user.fid });
    prefetchFollowing({ fid: user.fid });
  }, [
    prefetchFollowersYouKnow,
    prefetchFollowers,
    prefetchFollowing,
    user.fid,
  ]);

  return (
    <Tabs>
      {typeof cachedCurrentUser !== 'undefined' &&
        cachedCurrentUser.fid !== user.fid && (
          <LinkToFollowersYouKnow
            title={`Users you know following ${user.displayName}`}
            user={user}
            className="flex size-full items-center justify-center text-inherit"
            source="follows"
          >
            <Tab isFocused={focusedTab === 'followersYouKnow'}>
              Followers you know
            </Tab>
          </LinkToFollowersYouKnow>
        )}
      <LinkToFollowers
        title={`Users following ${user.displayName}`}
        user={user}
        className="flex size-full items-center justify-center text-inherit"
      >
        <Tab isFocused={focusedTab === 'followers'}>Followers</Tab>
      </LinkToFollowers>
      <LinkToFollowing
        title={`Users followed by ${user.displayName}`}
        user={user}
        className="flex size-full items-center justify-center text-inherit"
      >
        <Tab isFocused={focusedTab === 'following'}>Following</Tab>
      </LinkToFollowing>
    </Tabs>
  );
});

FollowsHeader.displayName = 'FollowsHeader';

export { FollowsHeader };
