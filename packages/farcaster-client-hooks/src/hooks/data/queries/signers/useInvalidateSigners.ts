import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSignersKey } from './buildSignersKey';

const useInvalidateSigners = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildSignersKey(),
    });
  }, [queryClient]);
};

export { useInvalidateSigners };
