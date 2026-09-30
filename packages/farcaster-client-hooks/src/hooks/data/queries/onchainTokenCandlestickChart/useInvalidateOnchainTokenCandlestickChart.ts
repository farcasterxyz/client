import { useQueryClient } from '@tanstack/react-query';
import { ApiGetOnchainTokenCandlestickChartQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildOnchainTokenCandlestickChartKey } from './buildOnchainTokenCandlestickChartKey';

const useInvalidateOnchainTokenCandlestickChart = () => {
  const queryClient = useQueryClient();

  const invalidateOnchainTokenCandlestickChart = useCallback(
    (params: ApiGetOnchainTokenCandlestickChartQueryParams) => {
      return queryClient.invalidateQueries({
        queryKey: buildOnchainTokenCandlestickChartKey(params),
      });
    },
    [queryClient],
  );

  return { invalidateOnchainTokenCandlestickChart };
};

export { useInvalidateOnchainTokenCandlestickChart };
