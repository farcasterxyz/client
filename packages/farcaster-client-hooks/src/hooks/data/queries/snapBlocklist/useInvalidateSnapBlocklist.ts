import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSnapBlocklistKey } from './buildSnapBlocklistKey';

export const useInvalidateSnapBlocklist = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildSnapBlocklistKey(),
    });
  }, [queryClient]);
};
