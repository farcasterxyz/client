import { NetworkMode } from '@tanstack/react-query';

import { MILLIS_PER_SECOND } from '../../../..';

const castCollectibleBidHistoryDefaultQueryOptions = {
  staleTime: MILLIS_PER_SECOND * 30,
  networkMode: 'offlineFirst' as NetworkMode,
  refetchInterval: MILLIS_PER_SECOND * 30,
  refetchOnWindowFocus: true,
  refetchOnMount: 'always' as const,
  refetchOnReconnect: true,
};

export { castCollectibleBidHistoryDefaultQueryOptions };
