import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokenSubscriptionsFetcher } from './buildTokenSubscriptionsFetcher';
import { buildTokenSubscriptionsKey } from './buildTokenSubscriptionsKey';

const useTokenSubscriptions = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildTokenSubscriptionsKey(),
    queryFn: buildTokenSubscriptionsFetcher({
      apiClient,
    }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
export { useTokenSubscriptions };
