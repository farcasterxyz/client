import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { UserCache } from '../../../../types';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserByFidFetcher } from './buildUserByFidFetcher';
import { buildUserByFidKey } from './buildUserByFidKey';

const useFetchUserByFid = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      const response = await buildUserByFidFetcher({
        apiClient,
        mergeIntoGloballyCachedUser,
        fid,
      })();

      if (response) {
        return queryClient.setQueryData<UserCache>(
          buildUserByFidKey({ fid }),
          response,
        );
      }

      return undefined;
    },
    [apiClient, mergeIntoGloballyCachedUser, queryClient],
  );
};

export { useFetchUserByFid };
