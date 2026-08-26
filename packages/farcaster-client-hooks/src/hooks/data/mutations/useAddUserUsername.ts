import { ApiUserUsername } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUserUsernames } from '../queries/userUsernames/useInvalidateUserUsernames';

const useAddUserUsername = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUserUsernames = useInvalidateUserUsernames();

  return useCallback(
    async ({ username }: { username: ApiUserUsername }) => {
      await apiClient.addUserUsername({ username });
      invalidateUserUsernames();
    },
    [apiClient, invalidateUserUsernames],
  );
};

export { useAddUserUsername };
