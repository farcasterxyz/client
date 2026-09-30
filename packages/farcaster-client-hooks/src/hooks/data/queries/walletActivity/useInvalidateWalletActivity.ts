import { useQueryClient } from '@tanstack/react-query';
import { ApiGetWalletActivityQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildWalletActivityKey } from './buildWalletActivityKey';

export const useInvalidateWalletActivity = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (params: Partial<ApiGetWalletActivityQueryParams>) => {
      return queryClient.invalidateQueries({
        queryKey: buildWalletActivityKey(params),
      });
    },
    [queryClient],
  );
};
