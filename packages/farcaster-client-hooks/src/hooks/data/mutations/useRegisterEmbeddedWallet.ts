import { ApiRegisterEmbeddedWalletRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRegisterEmbeddedWallet = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiRegisterEmbeddedWalletRequestBody) => {
      return apiClient.registerEmbeddedWallet(params);
    },
    [apiClient],
  );
};

export { useRegisterEmbeddedWallet };
