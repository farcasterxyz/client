import { useQueryClient } from '@tanstack/react-query';
import { CastHashPrefix } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useMergeIntoGloballyCachedCast } from '../globallyCachedCast';
import { buildUserCastFetcher } from './buildUserCastFetcher';
import { buildUserCastKey } from './buildUserCastKey';

const usePrefetchUserCast = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      username,
      hash,
      shouldSkipIfRecentlyPrefetched,
    }: {
      username: string;
      hash: string;
      shouldSkipIfRecentlyPrefetched?: boolean;
    }) => {
      const hashPrefix = hash as CastHashPrefix;

      const queryKey = buildUserCastKey({ username, hashPrefix });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }
      return queryClient.prefetchQuery({
        queryKey: queryKey,

        queryFn: buildUserCastFetcher({
          apiClient,
          mergeIntoGloballyCachedCast,
          username,
          hashPrefix,
        }),
      });
    },
    [
      apiClient,
      checkIfRecentlyPrefetched,
      mergeIntoGloballyCachedCast,
      queryClient,
    ],
  );
};

export { usePrefetchUserCast };
