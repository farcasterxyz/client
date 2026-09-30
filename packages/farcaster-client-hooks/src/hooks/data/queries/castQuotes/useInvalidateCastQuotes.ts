import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildCastQuotesKey } from './buildCastQuotesKey';

const useInvalidateCastQuotes = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ castHash }: { castHash: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildCastQuotesKey({ castHash }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateCastQuotes };
