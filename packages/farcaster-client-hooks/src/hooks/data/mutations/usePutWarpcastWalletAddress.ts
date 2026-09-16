import { ApiVerificationProtocol } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateUserAuthAddress } from '../queries/userAuthAddress';

const usePutWarpcastWalletAddress = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateUserAuthAddress = useInvalidateUserAuthAddress();

  return useCallback(
    async ({
      address,
      signature,
      protocol,
    }: {
      address: string;
      signature: string;
      protocol?: ApiVerificationProtocol;
    }) => {
      await apiClient.putWarpcastWalletAddress({
        address,
        signature,
        protocol,
      });

      // Now that the server is aware of the user's Warpcast wallet we'll
      // be able to proceeed registering it as an auth addres
      invalidateUserAuthAddress();
    },
    [apiClient, invalidateUserAuthAddress],
  );
};

export { usePutWarpcastWalletAddress };
