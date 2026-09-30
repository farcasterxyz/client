import { useQueryClient } from '@tanstack/react-query';
import {
  ApiCast,
  mergeWithBaseExceptArrays,
  shouldUpdateCache,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  CastUpdates,
  GloballyCachedCastCache,
  MergeIntoGloballyCachedCast,
} from '../../../../types';
import { buildGloballyCachedCastKey } from './buildGloballyCachedCastKey';
import { useGetGloballyCachedCast } from './useGetGloballyCachedCast';

const useMergeIntoGloballyCachedCast = (): MergeIntoGloballyCachedCast => {
  const queryClient = useQueryClient();
  const getCachedCast = useGetGloballyCachedCast();

  return useCallback(
    ({ updates }: { updates: CastUpdates }) => {
      const cacheKey = buildGloballyCachedCastKey({
        hash: updates.hash,
        recast: !!updates.recast,
      });

      const cachedCast = getCachedCast({
        hash: updates.hash,
        recast: !!updates.recast,
      });

      if (shouldUpdateCache({ cache: cachedCast, updates })) {
        queryClient.setQueryData<GloballyCachedCastCache>(
          cacheKey,
          (prevCast: undefined | ApiCast) =>
            mergeWithBaseExceptArrays({ base: {}, cache: prevCast, updates }),
        );
      }
    },
    [getCachedCast, queryClient],
  );
};

export { useMergeIntoGloballyCachedCast };
