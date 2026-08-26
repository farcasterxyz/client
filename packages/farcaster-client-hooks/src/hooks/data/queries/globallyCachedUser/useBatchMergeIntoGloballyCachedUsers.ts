import { useQueryClient } from '@tanstack/react-query';
import { ApiUser, shouldUpdateCache } from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  stringifyGlobalCacheUsageKey,
  useGlobalCacheUsage,
} from '../../../../providers/GlobalCacheUsageProvider';
import { useTelemetry } from '../../../../providers/TelemetryProvider';
import {
  BatchMergeIntoGloballyCachedUsers,
  GloballyCachedUserCache,
  UserUpdates,
} from '../../../../types';
import { buildGloballyCachedUserKey } from './buildGloballyCachedUserKey';

const useBatchMergeIntoGloballyCachedUsers = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}): BatchMergeIntoGloballyCachedUsers => {
  const queryClient = useQueryClient();
  const { getUsageCount } = useGlobalCacheUsage();
  const telemetry = useTelemetry();

  return useCallback(
    ({ batchUpdates }) => {
      if (!enabled) return; // No-op when disabled

      const startTime = Date.now();
      // First, transform the array of updates to a map, keyed on query key.
      const updatesMap: Record<string, UserUpdates> = {};
      batchUpdates.forEach((updates) => {
        const queryKey = buildGloballyCachedUserKey({
          fid: updates.fid,
        });

        const key = stringifyGlobalCacheUsageKey(queryKey);
        updatesMap[key] = {
          ...updatesMap[key],
          ...updates,
        };
      });

      // Then, query the cache for all globally cached users.
      // For any entry we encounter that has an associated update in our updates map,
      // commit the updates to the cache. We do this because we assume that
      // the updates are more recent that the cached data, so we need to override it.
      // For any updates we commit, we remove the associated key from our updates map,
      // so we don't need to bother with it in the next step.
      queryClient
        .getQueriesData<GloballyCachedUserCache>({
          queryKey: buildGloballyCachedUserKey({ fid: undefined }),
        })
        .forEach(([queryKey, cachedUser]) => {
          const stringifiedKey = stringifyGlobalCacheUsageKey(queryKey);
          const updates = updatesMap[stringifiedKey];
          if (!cachedUser || !updates) {
            return;
          }

          delete updatesMap[stringifiedKey];

          if (shouldUpdateCache({ cache: cachedUser, updates })) {
            queryClient.setQueryData<GloballyCachedUserCache>(queryKey, {
              ...cachedUser,
              ...updates,
            } as ApiUser);
          }
        });

      // Lastly, we iterate over updates in our map that didn't already have an associated cache entry.
      // For each set of updates, we check the usage count. If the usage count is
      // greater than 1 (i.e. the entity is being used in multiple places), we commit
      // the update to the cache to ensure we have the refreshest data everywhere.
      Object.entries(updatesMap).forEach(([key, updates]) => {
        if (getUsageCount(key) > 1) {
          queryClient.setQueryData<GloballyCachedUserCache>(
            buildGloballyCachedUserKey({
              fid: updates.fid,
            }),
            (prevValue) =>
              ({
                ...prevValue,
                ...updates,
              }) as GloballyCachedUserCache,
          );
        }
      });
      telemetry.maybeAddFrameDroppingAction(
        'farcaster-client-hooks.useBatchMergeIntoGloballyCachedUsers',
        Date.now() - startTime,
      );
    },
    [enabled, getUsageCount, queryClient, telemetry],
  );
};

export { useBatchMergeIntoGloballyCachedUsers };
