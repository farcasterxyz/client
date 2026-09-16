import { useQuery } from '@tanstack/react-query';
import { ApiChannel } from 'farcaster-client-data';
import merge from 'lodash/merge';
import { useEffect, useState } from 'react';

import {
  stringifyGlobalCacheUsageKey,
  useGlobalCacheUsage,
} from '../../../../providers/GlobalCacheUsageProvider';
import { buildGloballyCachedChannelKey } from './buildGloballyCachedChannelKey';

const useGloballyCachedChannel = ({
  fallback,
}: {
  fallback: ApiChannel;
}): ApiChannel => {
  const { addUsage, removeUsage } = useGlobalCacheUsage();

  const queryKey = buildGloballyCachedChannelKey({
    key: fallback.key,
  });

  // We always want `enabled` to be false for this `useQuery` call.
  // If React Query doesn't find our feed in the cache (for example, if it was stale and garbage collected),
  // we do not want to try to "fetch" the feed (i.e. execute the function passed in as the second argument).
  // It seems that executing this fetch function has the effect of putting the parent component
  // into a state of suspense, leading to a broken UX. See https://github.com/merkle-manufactory/mobile/pull/750.
  // Unfortunately, with the previous fix (i.e. relying on `getQueryData`), we don't get component re-renders
  // when the global feed data has changed, which leaves us showing stale data. Let's revert to using `useQuery`
  // to restore the re-rendering behavior, but hard-code `enabled` to `false` so it never tries to run the fetch function.
  // We need to provide a value here, so we'll return the given feed, but we would never expect this to run.
  // If no data is found in the cache, we would expect the `data` returned by `useQuery` to be `undefined`,
  // in which case we'll fall back to returning the given feed. See https://github.com/merkle-manufactory/mobile/pull/754.
  const cachedValue = useQuery({
    queryKey: queryKey,
    queryFn: () => fallback,
    enabled: false,
  }).data;

  const stringifiedKey = stringifyGlobalCacheUsageKey(queryKey);

  useEffect(() => {
    // Keep track of the number of mounted components referencing the globally cached resource.
    // This allows us to be more efficient with our global cache updates,
    // only committing changes (and consequentially triggering rerenders) when multiple components are using the resource.
    addUsage(stringifiedKey);
    return () => removeUsage(stringifiedKey);
  }, [addUsage, stringifiedKey, removeUsage]);

  // We keep a stateful reference to the the merged value (i.e. the fallback object combined with the global cache overrides),
  // so we can return a stable value if the hook re-renders but none of the inputs have changed.
  const [mergedValue, setMergedValue] = useState<ApiChannel>(
    merge({}, fallback, cachedValue),
  );

  useEffect(() => {
    // When either the fallback object or cached value change, we _do_ want to return a new object,
    // so any comonents/hooks depending on the return value know to update.
    setMergedValue(merge({}, fallback, cachedValue));
  }, [fallback, cachedValue]);

  // While the `useEffect` hook above should take care of updating the stateful merged value
  // any time the fallback or cached value change, we also merge the fallback and cached values
  // into our the current state's stable merged value before returning. Since we are merging into
  // the stable object (i.e. we aren't creating a new object each render), this assignment
  // won't trigger unnecessary re-renders for components/hooks depending on the return value.
  // However, in the event that the fallback of cached value change (which will trigger the `useEffect` above
  // to set `mergedValue` to a new value), by merging the new fallback and cached values into
  // our soon-to-be-stale merged value, we can render the new data slightly sooner (i.e. before the `useEffect` runs)
  // for any components that aren't waiting for the object reference to change.
  return merge(mergedValue, fallback, cachedValue);
};

export { useGloballyCachedChannel };
