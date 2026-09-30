import { ApiActivateTokenSubscriptionRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useActivateTokenSubscription = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ params }: { params: ApiActivateTokenSubscriptionRequestBody }) => {
      await apiClient.activateTokenSubscription(params);
    },
    [apiClient],
  );
};

export { useActivateTokenSubscription };
