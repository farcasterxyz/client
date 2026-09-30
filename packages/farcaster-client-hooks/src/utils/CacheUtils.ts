import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mergeWithBaseExceptArrays,
  shouldUpdateCache,
} from 'farcaster-client-data';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { stringifyGlobalCacheUsageKey } from '../providers/GlobalCacheUsageProvider';
import { DeepPartial } from './TypeUtils';

//
// An attempt at generic hooks for global caching
//

type KeyType<
  CachedType extends object,
  KeyFieldName extends keyof CachedType,
> = Pick<CachedType, KeyFieldName>;

export type Update<
  CachedType extends object,
  KeyFieldName extends keyof CachedType,
> = KeyType<CachedType, KeyFieldName> & DeepPartial<CachedType>;

export function useMergeIntoGlobalCache<
  CachedType extends object,
  KeyFieldName extends keyof CachedType,
>({
  keyGenerator,
}: {
  keyGenerator: (value: KeyType<CachedType, KeyFieldName>) => QueryKey;
}) {
  const queryClient = useQueryClient();

  return useCallback(
    (update: Update<CachedType, KeyFieldName>) => {
      const cacheKey = keyGenerator(update);

      const cachedValue = queryClient.getQueryData<CachedType | undefined>(
        cacheKey,
      );

      const defaults = queryClient.getQueryDefaults(cacheKey);

      if (shouldUpdateCache({ cache: cachedValue, updates: update })) {
        queryClient.setQueryDefaults(cacheKey, {
          structuralSharing: false,
        });

        queryClient.setQueryData<CachedType | undefined>(
          cacheKey,
          (prevValue: CachedType | undefined) => {
            const newValue = mergeWithBaseExceptArrays<
              CachedType,
              Update<CachedType, KeyFieldName>
            >({
              base: {},
              cache: prevValue,
              updates: update,
            });

            return newValue;
          },
        );

        queryClient.setQueryDefaults(cacheKey, defaults);
      }
    },
    [keyGenerator, queryClient],
  );
}

export function useBatchMergeIntoGlobalCache<
  CachedType extends object,
  KeyFieldName extends keyof CachedType,
>({
  keyGenerator,
}: {
  keyGenerator: (value: KeyType<CachedType, KeyFieldName>) => QueryKey;
}) {
  const mergeIntoGlobalCache = useMergeIntoGlobalCache({ keyGenerator });

  return useCallback(
    (updates: Update<CachedType, KeyFieldName>[]) => {
      for (const update of updates) {
        mergeIntoGlobalCache(update);
      }
    },
    [mergeIntoGlobalCache],
  );
}

export function useGloballyCachedObject<CachedType>({
  fallback,
  keyGenerator,
}: {
  fallback: CachedType;
  // Generate the global cache key to use; should change when the the fallback is replaced (e.g. new frame)
  keyGenerator: (value: CachedType) => QueryKey;
}): CachedType {
  const cacheKey = useMemo(
    () => keyGenerator(fallback),
    [fallback, keyGenerator],
  );

  const stringifiedKey = useMemo(
    () => stringifyGlobalCacheUsageKey(cacheKey),
    [cacheKey],
  );

  // We need a dummy query to front the cached value so that we get state updates (after directly inserting into the cache). We
  // use the fallback to make typing work, and the query is disabled so that the fallback does not overwrite the cached value.
  const cachedValue = useQuery({
    queryKey: cacheKey,
    queryFn: () => fallback,
    enabled: false,
  }).data;

  // We keep a reference to the the merged value (i.e. the fallback object combined with the global cache overrides),
  // so we can return a stable value if the hook re-renders but none of the inputs have changed.
  // We use a ref and not a state for performance reasons. Dependent components will re-render when the cached value changes anyway
  // so we don't need to trigger an additional re-render with state
  const mergedValueRef = useRef<CachedType | undefined>(undefined);

  useEffect(() => {
    // When either the fallback object or the cached value change, we _do_ want to return a new object,
    // so any components/hooks depending on the return value know to update
    if (!fallback) {
      // If the fallback is undefined/null, use it directly (there is no point storing {})
      mergedValueRef.current = undefined;
    } else {
      mergedValueRef.current = mergeWithBaseExceptArrays({
        base: {},
        cache: fallback,
        updates: cachedValue,
      });
    }
  }, [cachedValue, fallback]);

  // While the `useEffect` hook above takes care of generating a new merged value (used by consumers who need it),
  // we also merge the fallback and cached values directly into our the current mergedValue object. Since we aren't
  // creating a new object with each render, this won't trigger unnecessary re-renders for consumers of the return value.
  // However, in the event that the fallback of cached value change, by doing merge into the our soon-to-be-replaced merged value,
  // we can render the new data slightly sooner (i.e. before the `useEffect` runs) for any components that aren't waiting for the
  // object reference to change.
  return useMemo(() => {
    // Short-circuit if the fallback is undefined/null, as we don't want to return {}
    if (!fallback) {
      return fallback;
    }

    const mergedValue = mergedValueRef.current;

    // Change the base immediately if the cached value no longer corresponds to the fallback object, detected via a change in the
    // cache key
    // TS has some trouble with typing so we help it
    const base: CachedType | Record<string, never> =
      typeof mergedValue === 'undefined' ||
      stringifiedKey !== stringifyGlobalCacheUsageKey(keyGenerator(mergedValue))
        ? {}
        : mergedValue;

    return mergeWithBaseExceptArrays({
      base,
      cache: fallback,
      updates: cachedValue,
    });
  }, [cachedValue, fallback, keyGenerator, stringifiedKey]);
}

export function useOptimisticallyUpdateObject<
  CachedType extends object,
  KeyFieldName extends keyof CachedType,
>({
  keyGenerator,
}: {
  keyGenerator: (value: KeyType<CachedType, KeyFieldName>) => QueryKey;
}) {
  const queryClient = useQueryClient();
  const mergeIntoGlobalCache = useMergeIntoGlobalCache({ keyGenerator });

  return useCallback(
    (update: Update<CachedType, KeyFieldName>) => {
      const cacheKey = keyGenerator(update);
      const previouslyCachedValue = queryClient.getQueryData<
        CachedType | undefined
      >(cacheKey);

      mergeIntoGlobalCache(update);

      // Return revert function
      return () => {
        const defaults = queryClient.getQueryDefaults(cacheKey);

        queryClient.setQueryDefaults(cacheKey, {
          structuralSharing: false,
        });

        queryClient.setQueryData<CachedType | undefined>(
          cacheKey,
          previouslyCachedValue,
        );

        queryClient.setQueryDefaults(cacheKey, defaults);
      };
    },
    [keyGenerator, mergeIntoGlobalCache, queryClient],
  );
}
