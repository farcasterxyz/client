import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTokenHoldersKey } from './buildTokenHoldersKey';

const useInvalidateTokenHolders = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenHoldersKey({ chain, ca }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateTokenHolders };
