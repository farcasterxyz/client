import { ApiCreateTokenSubscriptionRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useCreateTokenSubscription = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ params }: { params: ApiCreateTokenSubscriptionRequestBody }) => {
      await apiClient.createTokenSubscription(params);
    },
    [apiClient],
  );
};

export { useCreateTokenSubscription };
