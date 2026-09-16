import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { UserCache } from '../../../../types';
import { useGetGloballyCachedUser } from '../globallyCachedUser/useGetGloballyCachedUser';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserFetcher } from './buildUserFetcher';
import { buildUserKey } from './buildUserKey';

const useFetchUser = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const getCachedUser = useGetGloballyCachedUser();

  return useCallback(
    async ({
      fid,
      readGlobalCache = false,
      isCurrentUser = false,
    }: {
      fid: number;
      readGlobalCache?: boolean;
      isCurrentUser?: boolean;
    }) => {
      if (readGlobalCache) {
        const cachedUser = getCachedUser({
          fid,
        });

        if (cachedUser) {
          return cachedUser;
        }
      }

      const response = await buildUserFetcher({
        apiClient,
        fid,
        mergeIntoGloballyCachedUser,
      })();

      return queryClient.setQueryData<UserCache>(
        buildUserKey({ fid, isCurrentUser }),
        response,
      );
    },
    [apiClient, getCachedUser, mergeIntoGloballyCachedUser, queryClient],
  );
};

export { useFetchUser };
