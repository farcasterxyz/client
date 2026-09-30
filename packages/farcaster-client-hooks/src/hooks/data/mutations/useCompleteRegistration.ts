import { signUsernameProof } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

export const useCompleteRegistration = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      account,
      data: { username, timestamp },
    }: {
      account: LocalAccountWithSign;
      data: {
        username: string;
        timestamp: number;
      };
    }) => {
      const signature = await signUsernameProof(
        {
          name: username,
          timestamp: BigInt(timestamp),
          owner: account.address,
        },
        account,
      );

      return apiClient.completeRegistration({
        fnameProof: {
          name: username,
          signature,
          timestamp,
        },
      });
    },
    [apiClient],
  );
};
