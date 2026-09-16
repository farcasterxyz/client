import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildTokenReportsSummaryKey } from './buildTokenReportsSummaryKey';

const useInvalidateTokenReportsSummary = () => {
  const queryClient = useQueryClient();

  const invalidateTokenReportsSummary = useCallback(
    ({ chain, ca }: { chain?: ApiChain; ca?: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenReportsSummaryKey({ chain, ca }),
      });
    },
    [queryClient],
  );

  return { invalidateTokenReportsSummary };
};

export { useInvalidateTokenReportsSummary };
