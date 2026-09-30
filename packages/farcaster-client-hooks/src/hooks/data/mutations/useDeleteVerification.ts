import { ApiVerificationProtocol } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUser } from '../queries/user/useInvalidateUser';
import { useInvalidateVerifications } from '../queries/verifications/useInvalidateVerifications';

const useDeleteVerification = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUser = useInvalidateUser();
  const invalidateVerifedAddresses = useInvalidateVerifications();

  return useCallback(
    async ({
      fid,
      signerAddress,
      protocol,
    }: {
      fid: number;
      signerAddress: string;
      protocol: ApiVerificationProtocol;
    }) => {
      await apiClient.deleteVerification({ signerAddress, protocol });

      invalidateUser({ fid });
      invalidateVerifedAddresses({ fid });
    },
    [apiClient, invalidateUser, invalidateVerifedAddresses],
  );
};

export { useDeleteVerification };
