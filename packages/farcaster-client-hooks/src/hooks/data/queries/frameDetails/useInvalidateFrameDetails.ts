import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFrameDetailsKey } from './buildFrameDetailsKey';

export const useInvalidateFrameDetails = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ domain }: { domain: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildFrameDetailsKey({ domain }),
      });
    },
    [queryClient],
  );
};
