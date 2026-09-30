import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { UserCache } from '../../../../types';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserByUsernameFetcher } from './buildUserByUsernameFetcher';
import { buildUserByUsernameKey } from './buildUserByUsernameKey';

const useFetchUserByUsername = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  return useCallback(
    async ({ username }: { username: string }) => {
      const response = await buildUserByUsernameFetcher({
        apiClient,
        mergeIntoGloballyCachedUser,
        username,
      })();

      if (response) {
        return queryClient.setQueryData<UserCache>(
          buildUserByUsernameKey({ username }),
          response,
        );
      }

      return undefined;
    },
    [apiClient, mergeIntoGloballyCachedUser, queryClient],
  );
};

export { useFetchUserByUsername };
