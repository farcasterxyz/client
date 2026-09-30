import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTraderSubscriptionsFetcher } from './buildTraderSubscriptionsFetcher';
import { buildTraderSubscriptionsKey } from './buildTraderSubscriptionsKey';

const useTraderSubscriptions = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildTraderSubscriptionsKey(),
    queryFn: buildTraderSubscriptionsFetcher({
      apiClient,
    }),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
export { useTraderSubscriptions };
