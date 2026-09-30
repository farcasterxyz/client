import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildApiKeysKey } from './buildApiKeysKey';

const useInvalidateApiKeys = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildApiKeysKey(),
    });
  }, [queryClient]);
};

export { useInvalidateApiKeys };
