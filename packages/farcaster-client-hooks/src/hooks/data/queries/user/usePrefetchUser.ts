import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserFetcher } from './buildUserFetcher';
import { buildUserKey } from './buildUserKey';

const usePrefetchUser = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      fid,
      isCurrentUser = false,
      shouldSkipIfRecentlyPrefetched,
    }: {
      fid: number;
      shouldSkipIfRecentlyPrefetched?: boolean;
      isCurrentUser?: boolean;
    }) => {
      const queryKey = buildUserKey({ fid, isCurrentUser });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchQuery({
        queryKey: queryKey,

        queryFn: buildUserFetcher({
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

export { usePrefetchUser };
