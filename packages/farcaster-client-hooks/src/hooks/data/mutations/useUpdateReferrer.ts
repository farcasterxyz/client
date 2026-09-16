import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUser } from '../queries/user/useInvalidateUser';

const useUpdateReferrer = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUser = useInvalidateUser();

  return useCallback(
    async ({ fid, username }: { fid: number; username: string }) => {
      await apiClient.setUserReferrer({ username });
      invalidateUser({ fid });
    },
    [apiClient, invalidateUser],
  );
};

export { useUpdateReferrer };
