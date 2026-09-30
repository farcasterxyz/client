import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildEngagementRingCandidatesFetcher } from './buildEngagementRingCandidatesFetcher';
import { buildEngagementRingCandidatesKey } from './buildEngagementRingCandidatesKey';
import { engagementRingCandidatesDefaultQueryOptions } from './engagementRingCandidatesDefaultQueryOptions';

const useEngagementRingCandidates = ({
  fid,
  enabled = true,
}: {
  fid?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...engagementRingCandidatesDefaultQueryOptions,
    queryKey: buildEngagementRingCandidatesKey({ fid }),
    queryFn:
      typeof fid === 'undefined'
        ? async () => {
            throw new Error(
              'fid is required to fetch engagement ring candidates',
            );
          }
        : buildEngagementRingCandidatesFetcher({
            apiClient,
            fid,
          }),
    enabled: enabled && typeof fid !== 'undefined',
  });
};

export { useEngagementRingCandidates };
