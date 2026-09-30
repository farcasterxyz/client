import { useQueryClient } from '@tanstack/react-query';
import { ApiChannel } from 'farcaster-client-data';
import { useCallback } from 'react';

import { GloballyCachedChannelCache } from '../../../../types';
import { buildGloballyCachedChannelKey } from './buildGloballyCachedChannelKey';

const useGetGloballyCachedChannel = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ key }: { key: string }) => {
      return queryClient.getQueryData<GloballyCachedChannelCache>(
        buildGloballyCachedChannelKey({ key }),
      ) as ApiChannel | undefined;
    },
    [queryClient],
  );
};

export { useGetGloballyCachedChannel };
