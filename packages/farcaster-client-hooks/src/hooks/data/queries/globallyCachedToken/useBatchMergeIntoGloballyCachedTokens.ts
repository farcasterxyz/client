import { useQueryClient } from '@tanstack/react-query';
import { ApiTokenLink, shouldUpdateCache } from 'farcaster-client-data';
import { useCallback } from 'react';

import { stringifyGlobalCacheUsageKey } from '../../../../providers/GlobalCacheUsageProvider';
import {
  BatchMergeIntoGloballyCachedTokens,
  GloballyCachedTokenCache,
  TokenUpdates,
} from '../../../../types';
import { buildGloballyCachedTokenKey } from './buildGloballyCachedTokenKey';

const useBatchMergeIntoGloballyCachedTokens =
  (): BatchMergeIntoGloballyCachedTokens => {
    const queryClient = useQueryClient();

    return useCallback(
      ({ batchUpdates }) => {
        // First, transform the array of updates to a map, keyed on query key.
        const updatesMap: Record<string, TokenUpdates> = {};
        batchUpdates.forEach((updates) => {
          const queryKey = buildGloballyCachedTokenKey({
            chain: updates.chain,
            ca: updates.ca,
          });

          const key = stringifyGlobalCacheUsageKey(queryKey);
          updatesMap[key] = { ...updatesMap[key], ...updates };
        });

        // Then, query the cache for all globally cached tokens.
        // For any entry we encounter that has an associated update in our updates map,
        // commit the updates to the cache. We do this because we assume that
        // the updates are more recent that the cached data, so we need to override it.
        // For any updates we commit, we remove the associated key from our updates map,
        // so we don't need to bother with it in the next step.
        queryClient
          .getQueriesData<GloballyCachedTokenCache>({
            queryKey: buildGloballyCachedTokenKey(),
          })
          .forEach(([queryKey, cachedToken]) => {
            const stringifiedKey = stringifyGlobalCacheUsageKey(queryKey);
            const updates = updatesMap[stringifiedKey];
            if (!cachedToken || !updates) {
              return;
            }

            delete updatesMap[stringifiedKey];

            if (shouldUpdateCache({ cache: cachedToken, updates })) {
              queryClient.setQueryData<GloballyCachedTokenCache>(queryKey, {
                ...cachedToken,
                ...updates,
              } as ApiTokenLink);
            }
          });

        // Lastly, we iterate over updates in our map that didn't already have an associated cache entry.
        Object.entries(updatesMap).forEach(([_key, updates]) => {
          queryClient.setQueryData<GloballyCachedTokenCache>(
            buildGloballyCachedTokenKey({
              chain: updates.chain,
              ca: updates.ca,
            }),
            (prevValue) =>
              ({
                ...prevValue,
                ...updates,
              }) as GloballyCachedTokenCache,
          );
        });
      },
      [queryClient],
    );
  };

export { useBatchMergeIntoGloballyCachedTokens };
