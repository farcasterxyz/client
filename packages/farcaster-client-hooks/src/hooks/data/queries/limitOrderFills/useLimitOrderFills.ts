import { useQuery } from '@tanstack/react-query';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildLimitOrderFillsFetcher } from './buildLimitOrderFillsFetcher';
import { buildLimitOrderFillsKey } from './buildLimitOrderFillsKey';

const useLimitOrderFills = ({
  orderId,
  enabled = true,
}: {
  orderId: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildLimitOrderFillsKey({ orderId }),
    queryFn: buildLimitOrderFillsFetcher({
      apiClient,
      orderId,
    }),
    staleTime: MILLIS_PER_SECOND * 30,
    enabled: enabled && !!orderId,
    refetchOnMount: 'always',
  });
};

export { useLimitOrderFills };
