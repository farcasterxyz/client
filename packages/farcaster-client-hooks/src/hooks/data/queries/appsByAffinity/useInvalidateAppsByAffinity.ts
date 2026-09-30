import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAppsByAffinityKey } from './buildAppsByAffinityKey';

const useInvalidateAppsByAffinity = () => {
  const queryClient = useQueryClient();

  const invalidateAppsByAffinity = useCallback(
    ({ fidOverride, limit }: { fidOverride?: number; limit?: number }) => {
      return queryClient.invalidateQueries({
        queryKey: buildAppsByAffinityKey({ fidOverride, limit }),
      });
    },
    [queryClient],
  );

  return { invalidateAppsByAffinity };
};

export { useInvalidateAppsByAffinity };
