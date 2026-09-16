import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDraftCaststormsKey } from './buildDraftCaststormsKey';

const useInvalidateDraftCaststorms = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildDraftCaststormsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateDraftCaststorms };
