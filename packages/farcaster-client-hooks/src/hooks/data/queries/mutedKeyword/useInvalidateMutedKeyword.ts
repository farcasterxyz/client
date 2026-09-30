import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildMutedKeywordKey } from './buildMutedKeywordKey';

const useInvalidateMutedKeyword = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ keyword }: { keyword: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildMutedKeywordKey({ keyword }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateMutedKeyword };
