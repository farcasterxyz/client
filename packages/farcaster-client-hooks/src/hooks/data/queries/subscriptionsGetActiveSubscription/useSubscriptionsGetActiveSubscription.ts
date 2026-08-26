import { useQuery } from '@tanstack/react-query';
import { ApiAccountSubscriptionType } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSubscriptionsGetActiveSubscriptionFetcher } from './buildSubscriptionsGetActiveSubscriptionFetcher';
import { buildSubscriptionsGetActiveSubscriptionKey } from './buildSubscriptionsGetActiveSubscriptionKey';

const useSubscriptionsGetActiveSubscription = ({
  fid,
  type,
}: {
  fid?: number;
  type: ApiAccountSubscriptionType;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildSubscriptionsGetActiveSubscriptionKey({ type, fid }),

    queryFn: buildSubscriptionsGetActiveSubscriptionFetcher({
      apiClient,
      type,
      fid,
    }),
  });
};

export { useSubscriptionsGetActiveSubscription };
