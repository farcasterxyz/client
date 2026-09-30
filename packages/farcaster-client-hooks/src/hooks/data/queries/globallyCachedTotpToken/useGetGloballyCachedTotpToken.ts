import { useQueryClient } from '@tanstack/react-query';
import { ApiTotpTokenContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import { TimestampedTotpToken } from '../../../../types';
import { buildGloballyCachedTotpTokenKey } from './buildGloballyCachedTotpTokenKey';

const TOKEN_TTL = 5 * 60 * 1000; // 5 minutes

const useGetGloballyCachedTotpToken = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ context }: { context: ApiTotpTokenContext }) => {
      const result = queryClient.getQueryData<TimestampedTotpToken>(
        buildGloballyCachedTotpTokenKey({ context }),
      );

      if (!result) {
        return undefined;
      }

      const isExpired = Date.now() - result.timestamp > TOKEN_TTL;
      if (isExpired) {
        queryClient.removeQueries({
          queryKey: buildGloballyCachedTotpTokenKey({ context }),
        });
        return undefined;
      }

      return result.token;
    },
    [queryClient],
  );
};

export { useGetGloballyCachedTotpToken };
