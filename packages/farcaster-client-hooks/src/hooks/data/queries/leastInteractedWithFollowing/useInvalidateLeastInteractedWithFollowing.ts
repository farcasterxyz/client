import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildLeastInteractedWithFollowingKey } from './buildLeastInteractedWithFollowingKey';

const useInvalidateLeastInteractedWithFollowing = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildLeastInteractedWithFollowingKey(),
    });
  }, [queryClient]);
};

export { useInvalidateLeastInteractedWithFollowing };
