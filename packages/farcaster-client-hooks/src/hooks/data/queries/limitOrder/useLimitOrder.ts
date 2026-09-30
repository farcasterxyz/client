import { useQuery } from '@tanstack/react-query';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildLimitOrderFetcher } from './buildLimitOrderFetcher';
import { buildLimitOrderKey } from './buildLimitOrderKey';

const useLimitOrder = ({
  orderId,
  enabled = true,
}: {
  orderId: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildLimitOrderKey({ orderId }),
    queryFn: buildLimitOrderFetcher({
      apiClient,
      orderId,
    }),
    staleTime: MILLIS_PER_SECOND * 30,
    enabled: enabled && !!orderId,
    refetchOnMount: 'always',
  });
};

export { useLimitOrder };
