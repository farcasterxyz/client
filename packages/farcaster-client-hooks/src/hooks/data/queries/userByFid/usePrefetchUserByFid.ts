import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserByFidFetcher } from './buildUserByFidFetcher';
import { buildUserByFidKey } from './buildUserByFidKey';

const usePrefetchUserByFid = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      shouldSkipIfRecentlyPrefetched = false,
      fid,
    }: {
      shouldSkipIfRecentlyPrefetched?: boolean;
      fid: number;
    }) => {
      const queryKey = buildUserByFidKey({ fid });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchQuery({
        queryKey: queryKey,

        queryFn: buildUserByFidFetcher({
          apiClient,
          fid,
          mergeIntoGloballyCachedUser,
        }),
      });
    },
    [
      checkIfRecentlyPrefetched,
      queryClient,
      apiClient,
      mergeIntoGloballyCachedUser,
    ],
  );
};

export { usePrefetchUserByFid };
