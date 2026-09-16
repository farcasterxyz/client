import { ApiDeactivateTokenSubscriptionRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDeactivateTokenSubscription = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      params,
    }: {
      params: ApiDeactivateTokenSubscriptionRequestBody;
    }) => {
      await apiClient.deactivateTokenSubscription(params);
    },
    [apiClient],
  );
};

export { useDeactivateTokenSubscription };
