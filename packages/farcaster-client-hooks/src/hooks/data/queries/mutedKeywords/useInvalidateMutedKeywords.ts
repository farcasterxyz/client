import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildMutedKeywordsKey } from './buildMutedKeywordsKey';

const useInvalidateMutedKeywords = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildMutedKeywordsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateMutedKeywords };
