import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic';
import { useInvalidateConnectedAccounts } from '../queries/connectedAccounts/useInvalidateConnectedAccounts';
import { useInvalidateUser } from '../queries/user/useInvalidateUser';
import { useInvalidateUserByFid } from '../queries/userByFid/useInvalidateUserByFid';

const useRemoveConnectedAccount = () => {
  const { apiClient } = useFarcasterApiClient();

  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  const invalidateConnectedAccounts = useInvalidateConnectedAccounts();
  const invalidateUser = useInvalidateUser();
  const invalidateUserByFid = useInvalidateUserByFid();

  return useCallback(
    async ({
      connectedAccountId,
      fid,
    }: {
      connectedAccountId: string;
      fid: number;
    }) => {
      optimisticallyUpdateUser({
        updates: {
          fid: fid,
          connectedAccounts: undefined,
        },
        revertUpdates: {
          fid: fid,
          connectedAccounts: [
            {
              connectedAccountId: connectedAccountId,
            },
          ],
        },
      });

      await apiClient.removeConnectedAccount({ connectedAccountId });

      await invalidateConnectedAccounts();
      invalidateUser({ fid });
      invalidateUserByFid({ fid });
    },
    [
      apiClient,
      invalidateConnectedAccounts,
      invalidateUser,
      invalidateUserByFid,
      optimisticallyUpdateUser,
    ],
  );
};

export { useRemoveConnectedAccount };
