import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildEngagementRingCandidatesKey } from './buildEngagementRingCandidatesKey';

const useInvalidateEngagementRingCandidates = () => {
  const queryClient = useQueryClient();

  const invalidateEngagementRingCandidates = useCallback(
    ({ fid }: { fid?: number }) => {
      return queryClient.invalidateQueries({
        queryKey: buildEngagementRingCandidatesKey({ fid }),
      });
    },
    [queryClient],
  );

  return { invalidateEngagementRingCandidates };
};

export { useInvalidateEngagementRingCandidates };
