import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildTokenLinksKey } from './buildTokenLinksKey';

const useInvalidateTokenLinks = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ ticker }: { ticker: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildTokenLinksKey({ ticker }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateTokenLinks };
