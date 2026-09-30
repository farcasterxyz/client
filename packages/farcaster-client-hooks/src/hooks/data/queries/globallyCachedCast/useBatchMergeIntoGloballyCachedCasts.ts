import { useQueryClient } from '@tanstack/react-query';
import { ApiCast, shouldUpdateCache } from 'farcaster-client-data';
import { useCallback } from 'react';

import { stringifyGlobalCacheUsageKey } from '../../../../providers/GlobalCacheUsageProvider';
import { useTelemetry } from '../../../../providers/TelemetryProvider';
import {
  BatchMergeIntoGloballyCachedCasts,
  CastUpdates,
  GloballyCachedCastCache,
} from '../../../../types';
import { buildGloballyCachedCastKey } from './buildGloballyCachedCastKey';

const TELEMETRY_ACTION_NAME =
  'farcaster-client-hooks.useBatchMergeIntoGloballyCachedCasts';

const useBatchMergeIntoGloballyCachedCasts =
  (): BatchMergeIntoGloballyCachedCasts => {
    const queryClient = useQueryClient();
    const telemetry = useTelemetry();

    return useCallback(
      ({ batchUpdates }) => {
        const startTime = Date.now();
        // First, transform the array of updates to a map, keyed on query key.
        const updatesMap: Record<string, CastUpdates> = {};
        batchUpdates.forEach((updates) => {
          const queryKey = buildGloballyCachedCastKey({
            hash: updates.hash,
            recast: !!updates.recast,
          });

          const key = stringifyGlobalCacheUsageKey(queryKey);
          updatesMap[key] = { ...updatesMap[key], ...updates };
        });

        // For each update, look up ONLY its own cache entry directly (bounded
        // by the batch size — typically one feed page, ~25) instead of
        // enumerating the entire globally-cached-cast cache with
        // getQueriesData({ exact: false }), which is O(total cached casts)
        // (hundreds-to-thousands during a long session) and showed up as
        // partialMatchKey in the JS-thread profile. Casts already in the cache
        // are updated in place; the rest fall through to the chunked pass below.
        const remainingUpdates: Array<[string, CastUpdates]> = [];
        for (const [stringifiedKey, updates] of Object.entries(updatesMap)) {
          const queryKey = buildGloballyCachedCastKey({
            hash: updates.hash,
            recast: !!updates.recast,
          });
          const cachedCast =
            queryClient.getQueryData<GloballyCachedCastCache>(queryKey);

          if (!cachedCast) {
            remainingUpdates.push([stringifiedKey, updates]);
            continue;
          }

          if (shouldUpdateCache({ cache: cachedCast, updates })) {
            queryClient.setQueryData<GloballyCachedCastCache>(queryKey, {
              ...cachedCast,
              ...updates,
            } as ApiCast);
          }
        }

        // Process remaining updates in chunks to avoid blocking the main thread
        const CHUNK_SIZE = 5;
        const chunks = [];
        for (let i = 0; i < remainingUpdates.length; i += CHUNK_SIZE) {
          chunks.push(remainingUpdates.slice(i, i + CHUNK_SIZE));
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          setTimeout(() => {
            chunk.forEach(([_key, updates]) => {
              queryClient.setQueryData<GloballyCachedCastCache>(
                buildGloballyCachedCastKey({
                  hash: updates.hash,
                  recast: !!updates.recast,
                }),
                (prevValue) =>
                  // We use this only for complete objects coming from the backend (vs
                  // for optimistic updates), therefore we do a simple merge
                  ({
                    ...prevValue,
                    ...updates,
                  }) as GloballyCachedCastCache,
              );
            });
          }, i * 5);
        }
        telemetry.maybeAddFrameDroppingAction(
          TELEMETRY_ACTION_NAME,
          Date.now() - startTime,
          {
            batchUpdates: batchUpdates.length,
          },
        );
      },
      [queryClient, telemetry],
    );
  };

export { useBatchMergeIntoGloballyCachedCasts };
