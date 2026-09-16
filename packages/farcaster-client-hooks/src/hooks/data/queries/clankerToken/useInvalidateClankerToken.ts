import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildClankerTokenKey } from './buildClankerTokenKey';
import { ApiGetClankerTokenQueryParams } from './types';

const useInvalidateClankerToken = () => {
  const queryClient = useQueryClient();

  const invalidateClankerToken = useCallback(
    (params: ApiGetClankerTokenQueryParams) => {
      return queryClient.invalidateQueries({
        queryKey: buildClankerTokenKey(params),
      });
    },
    [queryClient],
  );

  return { invalidateClankerToken };
};

export { useInvalidateClankerToken };
