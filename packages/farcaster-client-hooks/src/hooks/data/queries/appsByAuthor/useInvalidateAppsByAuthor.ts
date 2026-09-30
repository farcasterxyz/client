import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAppsByAuthorKey } from './buildAppsByAuthorKey';

export function useInvalidateAppsByAuthor({ fid }: { fid: number }) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildAppsByAuthorKey({ fid }),
    });
  }, [fid, queryClient]);
}
