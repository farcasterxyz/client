import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useCreateWarpcastSignedKeyRequest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    return await apiClient.createWarpcastSignedKeyRequest();
  }, [apiClient]);
};

export { useCreateWarpcastSignedKeyRequest };
