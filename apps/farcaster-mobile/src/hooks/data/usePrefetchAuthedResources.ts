import {
  useFetchUser,
  usePrefetchFeedItems,
  usePrefetchWalletLinks,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import {
  ConnectionStatus,
  useConnectionStatus,
} from '~/contexts/ConnectionStatusProvider';
import { useIsWalletLinksEnabled } from '~/hooks/useIsWalletLinksEnabled';
import { ResultReturnedNullError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { scheduleLowPriorityPromises, sleep } from '~/utils/PromiseUtils';

import { usePrefetchExploreFeed } from './usePrefetchExploreFeed';

const prefetchTimeout = 10_500;

type PrefetchAuthedResourcesOptions = {
  invalidateBeforePrefetch: boolean;
};

const usePrefetchAuthedResources = () => {
  const prefetchFeedItems = usePrefetchFeedItems();

  const prefetchExploreFeed = usePrefetchExploreFeed();

  const { prefetchWalletLinks } = usePrefetchWalletLinks();
  const isWalletLinksEnabled = useIsWalletLinksEnabled();

  const fetchUser = useFetchUser();

  const { checkConnection } = useConnectionStatus();

  const onNullFeedItemsResponse = useCallback(() => {
    trackError(
      new ResultReturnedNullError({
        screenOrProviderId: 'usePrefetchAuthedResources',
      }),
    );
  }, []);

  return useCallback(
    async (
      { fid }: { fid: number },
      { invalidateBeforePrefetch: _ }: PrefetchAuthedResourcesOptions,
    ) => {
      if (checkConnection) {
        const isOffline =
          (await checkConnection()) === ConnectionStatus.OFFLINE;
        if (isOffline) {
          return;
        }
      }

      const highPriorityPromises = [
        prefetchFeedItems({
          feedKey: 'home',
          feedType: 'default',
          updateState: true,
          onNullFeedItemsResponse: onNullFeedItemsResponse,
        }),
        prefetchFeedItems({
          feedKey: 'following',
          feedType: 'default',
          updateState: true,
          onNullFeedItemsResponse: onNullFeedItemsResponse,
        }),
        // The onboarding-state call already fetches and caches the user globally,
        // so we don't need to fetch it again if it's already cached.
        fetchUser({ fid, readGlobalCache: true, isCurrentUser: true }),
        prefetchExploreFeed(),
        ...(isWalletLinksEnabled ? [prefetchWalletLinks()] : []),
      ];

      // Schedule low-priority requests. We will fetch this data in the background when resources are available.
      // The resulting promises will not impact the promise we ultimately return,
      // so they will not block any call sites that are awaiting for the returned promise (i.e. the high-priority requests) to complete.
      scheduleLowPriorityPromises([]);

      // Return a promise that will be satisfied when either:
      // 1. all of the high-priority promises have resolved
      // 2. one or more of the high-priority promises rejects
      // 3. prefetching takes longer than prefetchTimeout milliseconds
      return Promise.race([
        Promise.all(highPriorityPromises).catch(() => null),
        sleep(prefetchTimeout),
      ]);
    },
    [
      checkConnection,
      fetchUser,
      isWalletLinksEnabled,
      onNullFeedItemsResponse,
      prefetchExploreFeed,
      prefetchFeedItems,
      prefetchWalletLinks,
    ],
  );
};

export { usePrefetchAuthedResources };
