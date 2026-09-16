import { useQueryClient } from '@tanstack/react-query';
import { ApiAccountSubscriptionType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSubscriptionsGetActiveSubscriptionFetcher } from './buildSubscriptionsGetActiveSubscriptionFetcher';
import { buildSubscriptionsGetActiveSubscriptionKey } from './buildSubscriptionsGetActiveSubscriptionKey';

const usePrefetchSubscriptionsGetActiveSubscription = ({
  fid,
  type,
}: {
  fid?: number;
  type: ApiAccountSubscriptionType;
}) => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(() => {
    return queryClient.prefetchQuery({
      queryKey: buildSubscriptionsGetActiveSubscriptionKey({ type, fid }),

      queryFn: buildSubscriptionsGetActiveSubscriptionFetcher({
        apiClient,
        type,
        fid,
      }),
    });
  }, [apiClient, type, queryClient, fid]);
};

export { usePrefetchSubscriptionsGetActiveSubscription };
