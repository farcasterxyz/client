import { NetworkMode } from '@tanstack/react-query';

const engagementRingCandidatesDefaultQueryOptions = {
  staleTime: 1000 * 60,
  gcTime: 1000 * 60 * 5,
  networkMode: 'offlineFirst' as NetworkMode,
  retry: false,
};

export { engagementRingCandidatesDefaultQueryOptions };
