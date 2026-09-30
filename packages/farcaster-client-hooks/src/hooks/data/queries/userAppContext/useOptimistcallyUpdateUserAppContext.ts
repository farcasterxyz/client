import { useQueryClient } from '@tanstack/react-query';
import { ApiUserAppContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildUserAppContextKey } from './buildUserAppContextKey';

export const useOptimisticallyUpdateUserAppContext = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (updates: Partial<ApiUserAppContext>) => {
      const userAppContextKey = buildUserAppContextKey();

      queryClient.setQueryData(
        userAppContextKey,
        (prev: ApiUserAppContext | undefined) =>
          prev ? { ...prev, ...updates } : undefined,
      );
    },
    [queryClient],
  );
};
