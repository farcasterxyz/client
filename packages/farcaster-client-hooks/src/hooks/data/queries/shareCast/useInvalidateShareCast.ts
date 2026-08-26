import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildShareCastKey } from './buildShareCastKey';

const useInvalidateShareCast = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ castHash }: { castHash: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildShareCastKey({ castHash }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateShareCast };
