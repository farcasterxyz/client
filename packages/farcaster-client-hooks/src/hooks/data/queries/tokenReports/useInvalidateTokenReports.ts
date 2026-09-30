import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTokenReportsKey } from './buildTokenReportsKey';

const useInvalidateTokenReports = () => {
  const queryClient = useQueryClient();

  const invalidateTokenReports = useCallback(
    ({ chain, ca }: { chain?: ApiChain; ca?: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenReportsKey({ chain, ca }),
      });
    },
    [queryClient],
  );

  return { invalidateTokenReports };
};

export { useInvalidateTokenReports };
