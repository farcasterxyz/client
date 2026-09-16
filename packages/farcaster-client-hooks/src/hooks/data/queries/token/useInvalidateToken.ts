import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTokenKey } from './buildTokenKey';

const useInvalidateToken = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenKey({ chain, ca }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateToken };
