import { ApiUpdateEmbeddedWalletRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUpdateEmbeddedWallet = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiUpdateEmbeddedWalletRequestBody) => {
      return apiClient.updateEmbeddedWallet(params);
    },
    [apiClient],
  );
};

export { useUpdateEmbeddedWallet };
