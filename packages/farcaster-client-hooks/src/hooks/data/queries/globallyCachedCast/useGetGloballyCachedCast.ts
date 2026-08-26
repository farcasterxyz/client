import { useQueryClient } from '@tanstack/react-query';
import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { GloballyCachedCastCache } from '../../../../types';
import { buildGloballyCachedCastKey } from './buildGloballyCachedCastKey';

const useGetGloballyCachedCast = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ hash, recast }: { hash: string; recast: boolean | undefined }) => {
      return queryClient.getQueryData<GloballyCachedCastCache>(
        buildGloballyCachedCastKey({
          hash,
          recast,
        }),
      ) as ApiCast | undefined;
    },
    [queryClient],
  );
};

export { useGetGloballyCachedCast };
