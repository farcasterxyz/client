import { ApiSignedVerificationClaim } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUser } from '../queries/user/useInvalidateUser';
import { useInvalidateVerifications } from '../queries/verifications/useInvalidateVerifications';

const usePutVerification = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUser = useInvalidateUser();
  const invalidateVerifedAddresses = useInvalidateVerifications();

  return useCallback(
    async ({
      fid,
      signedClaim,
      token,
    }: {
      fid: number;
      signedClaim: ApiSignedVerificationClaim;
      token: string;
    }) => {
      await apiClient.putVerification(
        { signedClaim },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      invalidateUser({ fid });
      invalidateVerifedAddresses({ fid });
    },
    [apiClient, invalidateUser, invalidateVerifedAddresses],
  );
};

export { usePutVerification };
