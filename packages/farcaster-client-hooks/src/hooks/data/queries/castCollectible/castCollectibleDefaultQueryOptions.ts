import { NetworkMode } from '@tanstack/react-query';

const castCollectibleDefaultQueryOptions = {
  staleTime: 0,
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  networkMode: 'offlineFirst' as NetworkMode,
};

export { castCollectibleDefaultQueryOptions };
