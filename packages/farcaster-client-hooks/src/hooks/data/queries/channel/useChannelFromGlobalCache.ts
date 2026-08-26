import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { MILLIS_PER_HOUR, MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildGloballyCachedChannelKey } from '../globallyCachedChannel';
import { useMergeIntoGloballyCachedChannel } from '../globallyCachedChannel/useMergeIntoGloballyCachedChannel';
import { buildChannelFetcher } from './buildChannelFetcher';

const useChannelFromGlobalCache = ({
  key,
  reduceStaleness = false,
}: {
  key: string | undefined;
  reduceStaleness?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();

  return useSuspenseQuery({
    queryKey: buildGloballyCachedChannelKey({ key }),

    queryFn: buildChannelFetcher({
      apiClient,
      key: key || '',
      mergeIntoGloballyCachedChannel,
    }),

    staleTime: reduceStaleness ? MILLIS_PER_SECOND * 10 : MILLIS_PER_HOUR,
  });
};

const useNonSuspenseChannelFromGlobalCache = ({
  key,
  reduceStaleness = false,
}: {
  key: string | undefined;
  reduceStaleness?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();

  return useQuery({
    queryKey: buildGloballyCachedChannelKey({ key }),

    queryFn: buildChannelFetcher({
      apiClient,
      key: key || '',
      mergeIntoGloballyCachedChannel,
    }),

    staleTime: reduceStaleness ? MILLIS_PER_SECOND * 10 : MILLIS_PER_HOUR,
    enabled: key !== undefined,
  });
};

export { useChannelFromGlobalCache, useNonSuspenseChannelFromGlobalCache };
