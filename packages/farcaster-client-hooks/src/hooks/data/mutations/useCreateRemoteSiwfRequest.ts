import { ApiCreateRemoteSiwfRequestRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useCreateRemoteSiwfRequest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiCreateRemoteSiwfRequestRequestBody) => {
      const response = await apiClient.createRemoteSiwfRequest(params);
      return response.data.result;
    },
    [apiClient],
  );
};

export { useCreateRemoteSiwfRequest };
