import { ApiDeleteTokenSubscriptionRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDeleteTokenSubscription = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ params }: { params: ApiDeleteTokenSubscriptionRequestBody }) => {
      await apiClient.deleteTokenSubscription(params);
    },
    [apiClient],
  );
};

export { useDeleteTokenSubscription };
