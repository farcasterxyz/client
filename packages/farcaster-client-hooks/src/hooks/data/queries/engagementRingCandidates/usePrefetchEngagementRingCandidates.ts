import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildEngagementRingCandidatesFetcher } from './buildEngagementRingCandidatesFetcher';
import { buildEngagementRingCandidatesKey } from './buildEngagementRingCandidatesKey';
import { engagementRingCandidatesDefaultQueryOptions } from './engagementRingCandidatesDefaultQueryOptions';

const usePrefetchEngagementRingCandidates = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const prefetchEngagementRingCandidates = useCallback(
    ({ fid }: { fid: number }) => {
      return queryClient.prefetchQuery({
        ...engagementRingCandidatesDefaultQueryOptions,
        queryKey: buildEngagementRingCandidatesKey({ fid }),
        queryFn: buildEngagementRingCandidatesFetcher({
          apiClient,
          fid,
        }),
      });
    },
    [apiClient, queryClient],
  );

  return { prefetchEngagementRingCandidates };
};

export { usePrefetchEngagementRingCandidates };
