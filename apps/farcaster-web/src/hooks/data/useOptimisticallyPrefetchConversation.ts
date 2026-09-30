import { ApiCast, getCastHashPrefix } from 'farcaster-client-data';
import {
  usePrefetchThread,
  usePrefetchUserThreadCasts,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCheckIfShouldSkipOptimisticPrefetch } from '~/hooks/data/useCheckIfShouldSkipOptimisticPrefetch';

const useOptimisticallyPrefetchConversation = ({
  cast,
}: {
  cast: Pick<ApiCast, 'author' | 'hash'>;
}) => {
  const checkIfShouldSkipOptimisticPrefetch =
    useCheckIfShouldSkipOptimisticPrefetch();

  const prefetchUserThreadCasts = usePrefetchUserThreadCasts();
  const prefetchThread = usePrefetchThread();

  return useCallback(() => {
    if (checkIfShouldSkipOptimisticPrefetch()) {
      return;
    }

    if (cast.author.username) {
      prefetchUserThreadCasts({
        castHashPrefix: getCastHashPrefix({ castHash: cast.hash }),
        username: cast.author.username,
        shouldSkipIfRecentlyPrefetched: true,
        // Prefetcing conversations work well in general, except when user takes an
        // action on the cast (i.e. liking) and then the batch update after request
        // ending for optimistic fetch overriding it. This results in phantom updates.
        // The main part about prefetching is to warm the RQ cache so loads of the page
        // is instant. This flag allows us to ignore values coming from thread calls.
        shouldAvoidUpdatingGlobalCache: true,
      });
    } else {
      prefetchThread({
        castHash: cast.hash,
        shouldSkipIfRecentlyPrefetched: true,
        // Prefetcing conversations work well in general, except when user takes an
        // action on the cast (i.e. liking) and then the batch update after request
        // ending for optimistic fetch overriding it. This results in phantom updates.
        // The main part about prefetching is to warm the RQ cache so loads of the page
        // is instant. This flag allows us to ignore values coming from thread calls.
        shouldAvoidUpdatingGlobalCache: true,
      });
    }
  }, [
    cast.author.username,
    cast.hash,
    prefetchThread,
    prefetchUserThreadCasts,
    checkIfShouldSkipOptimisticPrefetch,
  ]);
};

export { useOptimisticallyPrefetchConversation };
