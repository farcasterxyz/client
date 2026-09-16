import { useQuery } from '@tanstack/react-query';
import { ApiCast, mergeWithBaseExceptArrays } from 'farcaster-client-data';
import { useCallback, useEffect, useMemo } from 'react';

import {
  stringifyGlobalCacheUsageKey,
  useGlobalCacheUsage,
} from '../../../../providers/GlobalCacheUsageProvider';
import { useTelemetry } from '../../../../providers/TelemetryProvider';
import { useGloballyCachedUser } from '../globallyCachedUser';
import { buildGloballyCachedCastKey } from './buildGloballyCachedCastKey';

const TELEMETRY_ACTION_NAME = 'farcaster-client-hooks.useGloballyCachedCast';

const useGloballyCachedCast = ({
  fallback,
}: {
  fallback: ApiCast;
}): ApiCast => {
  const { addUsage, removeUsage } = useGlobalCacheUsage();
  const telemetry = useTelemetry();

  const queryKey = useMemo(
    () =>
      buildGloballyCachedCastKey({
        hash: fallback.hash,
        recast: !!fallback.recast,
      }),
    [fallback.hash, fallback.recast],
  );

  const fallbackCallback = useCallback(() => fallback, [fallback]);
  const options = useMemo(
    () => ({
      enabled: false,
    }),
    [],
  );

  // We always want `enabled` to be false for this `useQuery` call.
  // If React Query doesn't find our cast in the cache (for example, if it was stale and garbage collected),
  // we do not want to try to "fetch" the cast (i.e. execute the function passed in as the second argument).
  // It seems that executing this fetch function has the effect of putting the parent component
  // into a state of suspense, leading to a broken UX. See https://github.com/merkle-manufactory/mobile/pull/750.
  // Unfortunately, with the previous fix (i.e. relying on `getQueryData`), we don't get component re-renders
  // when the global cast data has changed, which leaves us showing stale data. Let's revert to using `useQuery`
  // to restore the re-rendering behavior, but hard-code `enabled` to `false` so it never tries to run the fetch function.
  // We need to provide a value here, so we'll return the given cast, but we would never expect this to run.
  // If no data is found in the cache, we would expect the `data` returned by `useQuery` to be `undefined`,
  // in which case we'll fall back to returning the given cast. See https://github.com/merkle-manufactory/mobile/pull/754.
  const castCachedValue = useQuery({
    queryKey: queryKey,
    queryFn: fallbackCallback,
    ...options,
  }).data;

  // We want to propagate any optimistic changes to the cast author up into the cast via a new cast reference, so
  // that feeds and threads can rerender it. We take the globally cached user object of the author and merge it into
  // the cachedValue, updating the result when either changes. This means that optimistic updates to the author have
  // to always be done via the global user cache, and not directly on the cast, or they will be overwritten.
  const authorCachedValue = useGloballyCachedUser({
    fallback: fallback.author,
  });

  // Cached value is undefined before an optimistic update, but we have to merge in the author, so we always make it
  // into a CastUpdates object
  const cachedValue: ApiCast = useMemo(
    () =>
      typeof castCachedValue !== 'undefined'
        ? { ...castCachedValue, author: authorCachedValue }
        : { ...fallback, author: authorCachedValue },
    [authorCachedValue, castCachedValue, fallback],
  );

  // The common case is a cast with no optimistic override: no cache entry
  // (castCachedValue undefined) and the author resolves to the same reference
  // as fallback.author. Skip the deep merges entirely and return the original
  // fallback — avoids cloning every cast on every render (lodash mergeWith) and
  // keeps a STABLE reference so consumers don't re-render on a no-op identity
  // change. Relies on useGloballyCachedUser returning fallback.author by
  // reference when the author has no override.
  const noOptimisticOverride =
    typeof castCachedValue === 'undefined' &&
    authorCachedValue === fallback.author;

  const stringifiedKey = useMemo(
    () => stringifyGlobalCacheUsageKey(queryKey),
    [queryKey],
  );

  useEffect(() => {
    // Keep track of the number of mounted components referencing the globally cached resource.
    // This allows us to be more efficient with our global cache updates,
    // only committing changes (and consequentially triggering rerenders) when multiple components are using the resource.
    addUsage(stringifiedKey);
    return () => removeUsage(stringifiedKey);
  }, [addUsage, stringifiedKey, removeUsage]);

  // Single merge per input change, memoized by (fallback identity, cached
  // value identity). useMemo already returns a stable reference while the
  // inputs are unchanged, and a fresh object when they change — which is what
  // tells consumers to update. This used to be an effect + ref + a second
  // in-render merge into the previous object (two deep merges per change, and
  // an in-render mutation that breaks React Compiler assumptions).
  return useMemo(() => {
    if (noOptimisticOverride) {
      return fallback;
    }
    const startTime = Date.now();
    const mergedValue = mergeWithBaseExceptArrays({
      base: {},
      cache: fallback,
      updates: cachedValue,
    });
    telemetry.maybeAddFrameDroppingAction(
      `${TELEMETRY_ACTION_NAME}.mergeWithBaseExceptArrays`,
      Date.now() - startTime,
      {
        hash: fallback.hash,
      },
    );
    return mergedValue;
  }, [cachedValue, fallback, telemetry, noOptimisticOverride]);
};

export { useGloballyCachedCast };
