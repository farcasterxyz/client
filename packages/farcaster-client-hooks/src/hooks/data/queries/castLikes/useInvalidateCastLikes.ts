import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildCastLikesKey } from './buildCastLikesKey';

const useInvalidateCastLikes = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ castHash }: { castHash: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildCastLikesKey({ castHash }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateCastLikes };
