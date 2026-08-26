import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserByUsernameFetcher } from './buildUserByUsernameFetcher';
import { buildUserByUsernameKey } from './buildUserByUsernameKey';

const usePrefetchUserByUsername = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      shouldSkipIfRecentlyPrefetched = false,
      username,
    }: {
      shouldSkipIfRecentlyPrefetched?: boolean;
      username: string;
    }) => {
      const queryKey = buildUserByUsernameKey({ username });

      if (
        shouldSkipIfRecentlyPrefetched &&
        checkIfRecentlyPrefetched({ queryKey })
      ) {
        return;
      }

      queryClient.prefetchQuery({
        queryKey: queryKey,

        queryFn: buildUserByUsernameFetcher({
          apiClient,
          username,
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

export { usePrefetchUserByUsername };
