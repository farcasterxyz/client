import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildThreadKey } from './buildThreadKey';

const useInvalidateThread = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ castHash }: { castHash: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildThreadKey({ castHash }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateThread };
