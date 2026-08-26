import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildReportedTokensKey } from './buildReportedTokensKey';

const useInvalidateReportedTokens = () => {
  const queryClient = useQueryClient();

  const invalidateReportedTokens = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildReportedTokensKey(),
    });
  }, [queryClient]);

  return { invalidateReportedTokens };
};

export { useInvalidateReportedTokens };
