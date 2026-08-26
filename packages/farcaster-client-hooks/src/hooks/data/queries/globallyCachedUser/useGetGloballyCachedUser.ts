import { useQueryClient } from '@tanstack/react-query';
import { ApiUser } from 'farcaster-client-data';
import { useCallback } from 'react';

import { GloballyCachedUserCache } from '../../../../types';
import { buildGloballyCachedUserKey } from './buildGloballyCachedUserKey';

const useGetGloballyCachedUser = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }): ApiUser | undefined => {
      if (!enabled) return undefined; // No-op when disabled

      return queryClient.getQueryData<GloballyCachedUserCache>(
        buildGloballyCachedUserKey({ fid }),
      );
    },
    [enabled, queryClient],
  );
};

export { useGetGloballyCachedUser };
