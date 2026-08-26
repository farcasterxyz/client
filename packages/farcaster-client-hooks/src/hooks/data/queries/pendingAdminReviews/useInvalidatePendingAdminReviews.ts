import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildPendingAdminReviewsKey } from './buildPendingAdminReviewsKey';

const useInvalidatePendingAdminReviews = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildPendingAdminReviewsKey(),
    });
  }, [queryClient]);
};

export { useInvalidatePendingAdminReviews };
