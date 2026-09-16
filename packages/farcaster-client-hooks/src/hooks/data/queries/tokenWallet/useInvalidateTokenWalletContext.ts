import { useQueryClient } from '@tanstack/react-query';
import { ApiGetTokenWalletContextQueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTokenWalletContextKey } from './buildTokenWalletContextKey';

const useInvalidateTokenWalletContext = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (params: ApiGetTokenWalletContextQueryParams) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenWalletContextKey(params),
      });
    },
    [queryClient],
  );
};

export { useInvalidateTokenWalletContext };
