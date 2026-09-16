import { ApiUser } from 'farcaster-client-data';
import {
  usePrefetchUser,
  usePrefetchUserByUsername,
  usePrefetchUserCasts,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCheckIfShouldSkipOptimisticPrefetch } from '~/hooks/data/useCheckIfShouldSkipOptimisticPrefetch';

const useOptimisticallyPrefetchProfile = ({
  user,
}: {
  user: Pick<ApiUser, 'fid' | 'username'>;
}) => {
  const checkIfShouldSkipOptimisticPrefetch =
    useCheckIfShouldSkipOptimisticPrefetch();

  const prefetchUser = usePrefetchUser();
  const prefetchUserByUsername = usePrefetchUserByUsername();
  const prefetchUserCasts = usePrefetchUserCasts();

  return useCallback(() => {
    if (checkIfShouldSkipOptimisticPrefetch()) {
      return;
    }

    if (user.username) {
      prefetchUserByUsername({
        username: user.username,
        shouldSkipIfRecentlyPrefetched: true,
      });
    } else if (user.fid) {
      prefetchUser({
        fid: user.fid,
        shouldSkipIfRecentlyPrefetched: true,
      });
    }

    if (user.fid) {
      prefetchUserCasts({
        fid: user.fid,
        shouldSkipIfRecentlyPrefetched: true,
      });
    }
  }, [
    checkIfShouldSkipOptimisticPrefetch,
    user.username,
    user.fid,
    prefetchUserCasts,
    prefetchUserByUsername,
    prefetchUser,
  ]);
};

export { useOptimisticallyPrefetchProfile };
