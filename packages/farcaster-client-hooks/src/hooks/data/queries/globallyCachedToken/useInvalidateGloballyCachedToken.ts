import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildGloballyCachedTokenKey } from './buildGloballyCachedTokenKey';

const useInvalidateGloballyCachedToken = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildGloballyCachedTokenKey({ chain, ca }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateGloballyCachedToken };
