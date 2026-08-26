import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDraftCastsKey } from './buildDraftCastsKey';

const useInvalidateDraftCasts = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ channelKey }: { channelKey: string | undefined }) => {
      return queryClient.invalidateQueries({
        queryKey: buildDraftCastsKey({ channelKey }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateDraftCasts };
