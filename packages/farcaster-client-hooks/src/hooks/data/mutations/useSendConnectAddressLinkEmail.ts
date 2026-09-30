import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSendConnectAddressLinkEmail = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    const response = await apiClient.sendConnectAddressLinkEmail();

    return response.data;
  }, [apiClient]);
};

export { useSendConnectAddressLinkEmail };
