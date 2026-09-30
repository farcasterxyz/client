import { ApiUpdateRemoteSiwfRequestRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUpdateRemoteSiwfRequest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiUpdateRemoteSiwfRequestRequestBody) => {
      return await apiClient.updateRemoteSiwfRequest(params);
    },
    [apiClient],
  );
};

export { useUpdateRemoteSiwfRequest };
