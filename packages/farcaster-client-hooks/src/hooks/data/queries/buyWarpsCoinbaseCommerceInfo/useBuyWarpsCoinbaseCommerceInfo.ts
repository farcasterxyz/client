import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildBuyWarpsCoinbaseCommerceInfoFetcher } from './buildBuyWarpsCoinbaseCommerceInfoFetcher';
import { buildBuyWarpsCoinbaseCommerceInfoKey } from './buildBuyWarpsCoinbaseCommerceInfoKey';

const useBuyWarpsCoinbaseCommerceInfo = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildBuyWarpsCoinbaseCommerceInfoKey(),
    queryFn: buildBuyWarpsCoinbaseCommerceInfoFetcher({ apiClient }),
  });
};

export { useBuyWarpsCoinbaseCommerceInfo };
