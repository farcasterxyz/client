import { useQuery } from '@tanstack/react-query';
import { ApiUser } from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useCallback, useEffect, useMemo } from 'react';

import {
  stringifyGlobalCacheUsageKey,
  useGlobalCacheUsage,
} from '../../../../providers/GlobalCacheUsageProvider';
import { useTelemetry } from '../../../../providers/TelemetryProvider';
import { buildGloballyCachedUserKey } from './buildGloballyCachedUserKey';

const useGloballyCachedUser = ({
  fallback,
  enabled = true,
}: {
  fallback: ApiUser;
  enabled?: boolean;
}) => {
  const { addUsage, removeUsage } = useGlobalCacheUsage();
  const telemetry = useTelemetry();

  const queryKey = useMemo(
    () =>
      buildGloballyCachedUserKey({
        fid: fallback.fid,
      }),
    [fallback],
  );

  const fallbackCallback = useCallback(() => fallback, [fallback]);

  const cachedValue = useQuery({
    queryKey: queryKey,
    queryFn: fallbackCallback,
    enabled,
  }).data;

  const stringifiedKey = useMemo(
    () => stringifyGlobalCacheUsageKey(queryKey),
    [queryKey],
  );

  useEffect(() => {
    if (!enabled) return;

    // Keep track of the number of mounted components referencing the globally cached resource.
    // This allows us to be more efficient with our global cache updates,
    // only committing changes (and consequentially triggering rerenders) when multiple components are using the resource.
    addUsage(stringifiedKey);
    return () => removeUsage(stringifiedKey);
  }, [enabled, addUsage, stringifiedKey, removeUsage]);

  // Single merge per input change, memoized by (fallback identity, cached
  // value identity). useMemo already returns a stable reference while the
  // inputs are unchanged, and a fresh object when they change — which is what
  // tells consumers to update. This used to be an effect + ref + a second
  // in-render merge into the previous object (two deep merges per change, and
  // an in-render mutation that breaks React Compiler assumptions).
  return useMemo(() => {
    if (!enabled) return fallback;

    // No optimistic override in the cache → return the fallback as-is. Skips a
    // per-render lodash deep-clone of every user object and returns a STABLE
    // reference so consumers (e.g. cast rows via useGloballyCachedCast) don't
    // re-render on an identity change that carried no data change.
    if (typeof cachedValue === 'undefined') return fallback;

    // Recycled FlashList cells can briefly observe a cachedValue that belongs
    // to a different user than the current fallback during fast scrolls.
    // Never merge data across fids — return the fallback until the observer
    // catches up.
    if (cachedValue.fid !== fallback.fid) return fallback;

    const startTime = Date.now();
    const mergedValue = merge({}, fallback, cachedValue);
    telemetry.maybeAddFrameDroppingAction(
      'farcaster-client-hooks.useGloballyCachedUser',
      Date.now() - startTime,
      {
        fid: fallback.fid,
      },
    );
    return mergedValue;
  }, [enabled, cachedValue, fallback, telemetry]);
};

export { useGloballyCachedUser };
