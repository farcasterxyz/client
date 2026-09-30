import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAuthSessionsKey } from './buildAuthSessionsKey';

const useInvalidateAuthSessions = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildAuthSessionsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateAuthSessions };
