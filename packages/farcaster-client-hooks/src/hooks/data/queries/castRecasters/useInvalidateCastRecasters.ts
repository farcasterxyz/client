import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildCastRecastersKey } from './buildCastRecastersKey';

const useInvalidateCastRecasters = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ castHash }: { castHash: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildCastRecastersKey({ castHash }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateCastRecasters };
