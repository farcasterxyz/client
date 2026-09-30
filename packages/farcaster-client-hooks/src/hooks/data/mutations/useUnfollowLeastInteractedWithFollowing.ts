import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateFollowers } from '../queries/followers/useInvalidateFollowers';
import { useInvalidateFollowing } from '../queries/following/useInvalidateFollowing';
import { useInvalidateLeastInteractedWithFollowing } from '../queries/leastInteractedWithFollowing/useInvalidateLeastInteractedWithFollowing';

const useUnfollowLeastInteractedWithFollowing = () => {
  const { apiClient } = useFarcasterApiClient();

  const invalidateFollowing = useInvalidateFollowing();
  const invalidateFollowers = useInvalidateFollowers();
  const invalidateLeastInteractedWithFollowing =
    useInvalidateLeastInteractedWithFollowing();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      await apiClient.unfollowLeastInteractedWithFollowing();

      invalidateFollowing({ fid });
      invalidateFollowers({ fid });
      invalidateLeastInteractedWithFollowing();
    },
    [
      apiClient,
      invalidateFollowers,
      invalidateFollowing,
      invalidateLeastInteractedWithFollowing,
    ],
  );
};

export { useUnfollowLeastInteractedWithFollowing };
