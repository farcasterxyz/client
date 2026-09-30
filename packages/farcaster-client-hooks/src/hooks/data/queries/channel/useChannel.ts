import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedChannel } from '../globallyCachedChannel/useMergeIntoGloballyCachedChannel';
import { buildChannelFetcher } from './buildChannelFetcher';
import { buildChannelKey } from './buildChannelKey';

export const useChannel = ({ key }: { key: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();

  return useSuspenseQuery({
    queryKey: buildChannelKey({ key }),
    queryFn: buildChannelFetcher({
      apiClient,
      key,
      mergeIntoGloballyCachedChannel,
    }),
  });
};
