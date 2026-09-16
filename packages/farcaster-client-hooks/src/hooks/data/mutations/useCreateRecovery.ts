import { useCallback } from 'react';
import type { Hex } from 'viem';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import type { LocalAccountWithSign } from '../account';

const useCreateRecovery = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      token,
      address,
      account,
      totpToken,
    }: {
      token: string;
      address: string;
      account: LocalAccountWithSign;
      totpToken?: string;
    }) => {
      const deadline = Math.floor(Date.now() / 1000) + 28 * 24 * 3600; // 28 days
      const hashResponse = await apiClient.getRecoverHash({
        token,
        address,
        deadline,
      });

      const signature = await account.sign({
        hash: hashResponse.data.result.hash as Hex,
      });
      const response = await apiClient.createRecovery({
        token,
        address,
        deadline,
        signature,
        totpToken,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useCreateRecovery };
