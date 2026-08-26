import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUser } from '../queries/user/useInvalidateUser';
import { useInvalidateUserUsernames } from '../queries/userUsernames/useInvalidateUserUsernames';

const useSetUserUsername = () => {
  const { apiClient } = useFarcasterApiClient();

  const invalidateUser = useInvalidateUser();
  const invalidateUserUsernames = useInvalidateUserUsernames();

  return useCallback(
    async ({ fid, username }: { fid: number; username: string }) => {
      await apiClient.setUserUsername({ username });

      invalidateUser({ fid });
      invalidateUserUsernames();
    },
    [apiClient, invalidateUser, invalidateUserUsernames],
  );
};

export { useSetUserUsername };
