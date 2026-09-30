import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { ApiChain, ApiTokenLink } from 'farcaster-client-data';
import { useCallback } from 'react';

import { GloballyCachedTokenCache } from '../../../../types';
import { buildGloballyCachedTokenKey } from './buildGloballyCachedTokenKey';

const buildGetGloballyCachedToken = (queryClient: QueryClient) => {
  return ({ chain, ca }: { chain: ApiChain; ca: string }) => {
    return queryClient.getQueryData<GloballyCachedTokenCache>(
      buildGloballyCachedTokenKey({ chain, ca }),
    ) as ApiTokenLink | undefined;
  };
};

const useGetGloballyCachedToken = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      const getGloballyCachedToken = buildGetGloballyCachedToken(queryClient);
      return getGloballyCachedToken({ chain, ca });
    },
    [queryClient],
  );
};

export { buildGetGloballyCachedToken, useGetGloballyCachedToken };
