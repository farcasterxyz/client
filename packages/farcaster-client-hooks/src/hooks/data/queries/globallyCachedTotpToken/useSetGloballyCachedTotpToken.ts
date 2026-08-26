import { useQueryClient } from '@tanstack/react-query';
import { ApiTotpTokenContext } from 'farcaster-client-data';

import { TimestampedTotpToken } from '../../../../types';
import { buildGloballyCachedTotpTokenKey } from './buildGloballyCachedTotpTokenKey';

const useSetGloballyCachedTotpToken = () => {
  const queryClient = useQueryClient();

  return ({
    context,
    token,
  }: {
    context: ApiTotpTokenContext;
    token: string;
  }) => {
    queryClient.setQueryData<TimestampedTotpToken>(
      buildGloballyCachedTotpTokenKey({ context }),
      {
        token,
        timestamp: Date.now(),
      },
    );
  };
};

export { useSetGloballyCachedTotpToken };
