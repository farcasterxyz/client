import { useQueryClient } from '@tanstack/react-query';
import { ApiChannel, shouldUpdateCache } from 'farcaster-client-data';
import { useCallback } from 'react';

import { stringifyGlobalCacheUsageKey } from '../../../../providers/GlobalCacheUsageProvider';
import {
  BatchMergeIntoGloballyCachedChannels,
  ChannelUpdates,
  GloballyCachedChannelCache,
} from '../../../../types';
import { buildGloballyCachedChannelKey } from './buildGloballyCachedChannelKey';

const useBatchMergeIntoGloballyCachedChannels =
  (): BatchMergeIntoGloballyCachedChannels => {
    const queryClient = useQueryClient();

    return useCallback(
      ({ batchUpdates }) => {
        // First, transform the array of updates to a map, keyed on query key.
        const updatesMap: Record<string, ChannelUpdates> = {};
        batchUpdates.forEach((updates) => {
          const queryKey = buildGloballyCachedChannelKey({
            key: updates.key,
          });

          const key = stringifyGlobalCacheUsageKey(queryKey);
          updatesMap[key] = { ...updatesMap[key], ...updates };
        });

        // Then, query the cache for all globally cached feeds.
        // For any entry we encounter that has an associated update in our updates map,
        // commit the updates to the cache. We do this because we assume that
        // the updates are more recent that the cached data, so we need to override it.
        // For any updates we commit, we remove the associated key from our updates map,
        // so we don't need to bother with it in the next step.
        queryClient
          .getQueriesData<GloballyCachedChannelCache>({
            queryKey: buildGloballyCachedChannelKey({
              key: undefined,
            }),
          })
          .forEach(([queryKey, cachedChannel]) => {
            const stringifiedKey = stringifyGlobalCacheUsageKey(queryKey);
            const updates = updatesMap[stringifiedKey];
            if (!cachedChannel || !updates) {
              return;
            }

            delete updatesMap[stringifiedKey];

            if (shouldUpdateCache({ cache: cachedChannel, updates })) {
              queryClient.setQueryData<GloballyCachedChannelCache>(queryKey, {
                ...cachedChannel,
                ...updates,
              } as ApiChannel);
            }
          });

        // Lastly, we iterate over updates in our map that didn't already have an associated cache entry.
        Object.entries(updatesMap).forEach(([_key, updates]) => {
          queryClient.setQueryData<GloballyCachedChannelCache>(
            buildGloballyCachedChannelKey({
              key: updates.key,
            }),
            (prevValue) =>
              ({
                ...prevValue,
                ...updates,
              }) as GloballyCachedChannelCache,
          );
        });
      },
      [queryClient],
    );
  };

export { useBatchMergeIntoGloballyCachedChannels };
