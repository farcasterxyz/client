import {
  usePrefetchActiveChannelStreak,
  usePrefetchUser,
  usePrefetchUserByUsername,
  usePrefetchUserFollowingChannels,
} from 'farcaster-client-hooks';
import { FC, memo, useEffect } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const PreloadAuthedResources: FC = memo(() => {
  const currentUser = useCurrentUser();

  const prefetchUser = usePrefetchUser();
  const prefetchUserByUsername = usePrefetchUserByUsername();
  const prefetchUserFollowingChannels = usePrefetchUserFollowingChannels();
  const prefetchActiveChannelStreak = usePrefetchActiveChannelStreak();

  useEffect(() => {
    prefetchUser({
      fid: currentUser.fid,
      shouldSkipIfRecentlyPrefetched: true,
    });

    prefetchUserFollowingChannels({
      forComposer: true,
      shouldSkipIfRecentlyPrefetched: true,
    });

    if (currentUser.username) {
      prefetchUserByUsername({
        shouldSkipIfRecentlyPrefetched: true,
        username: currentUser.username,
      });
    }

    prefetchActiveChannelStreak({ fid: currentUser.fid });
  }, [
    currentUser.fid,
    currentUser.username,
    prefetchUser,
    prefetchUserByUsername,
    prefetchUserFollowingChannels,
    prefetchActiveChannelStreak,
  ]);

  return null;
});

PreloadAuthedResources.displayName = 'PreloadAuthedResources';

export { PreloadAuthedResources };
