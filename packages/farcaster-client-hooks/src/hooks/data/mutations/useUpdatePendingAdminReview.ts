import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidatePendingAdminReviews } from '../queries/pendingAdminReviews/useInvalidatePendingAdminReviews';

const useUpdatePendingAdminReview = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidatePendingAdminReviews = useInvalidatePendingAdminReviews();

  return useCallback(
    async ({ reviewId, approve }: { reviewId: string; approve: boolean }) => {
      await apiClient.updatePendingAdminReview({
        reviewId,
        approve,
      });

      await invalidatePendingAdminReviews();
    },
    [apiClient, invalidatePendingAdminReviews],
  );
};

export { useUpdatePendingAdminReview };
