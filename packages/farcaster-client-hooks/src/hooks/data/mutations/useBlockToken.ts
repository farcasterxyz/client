import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useBlockToken = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      chain,
      ca,
      reason,
    }: {
      chain: ApiChain;
      ca: string;
      reason: string;
    }) => {
      await apiClient.blockToken({ chain, ca, reason });
    },
    [apiClient],
  );
};

export { useBlockToken };
