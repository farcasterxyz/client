import { ApiSettableUserQuality } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUser } from '../queries/user/useInvalidateUser';
import { useInvalidateUserByFid } from '../queries/userByFid/useInvalidateUserByFid';
import { useInvalidateUserByUsername } from '../queries/userByUsername/useInvalidateUserByUsername';

const useSetUserQuality = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUser = useInvalidateUser();
  const invalidateUserByFid = useInvalidateUserByFid();
  const invalidateUserByUsername = useInvalidateUserByUsername();

  return useCallback(
    async ({
      fid,
      username,
      quality,
      badness,
      reason,
    }: {
      fid: number;
      username?: string;
      quality: ApiSettableUserQuality;
      badness?: number;
      reason: string;
    }) => {
      const response = await apiClient.setUserQuality({
        fid,
        quality,
        badness,
        reason,
      });

      // Delay due to replication log
      setTimeout(() => {
        invalidateUserByFid({ fid });
        invalidateUser({ fid });
        if (username) {
          invalidateUserByUsername({ username });
        }
      }, 500);

      return response.data;
    },
    [apiClient, invalidateUser, invalidateUserByFid, invalidateUserByUsername],
  );
};

export { useSetUserQuality };
