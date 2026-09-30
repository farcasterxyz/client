import { useCallback } from 'react';

import { useRecentFetch } from '~/contexts/RecentFetchProvider';
import { useScroll } from '~/contexts/ScrollProvider';

const lastScrollWindowDuration = 500;
const recentFetchCountThreshold = 5;

const useCheckIfShouldSkipOptimisticPrefetch = () => {
  const { getLastScrolledAt } = useScroll();
  const { getRecentFetchCount } = useRecentFetch();

  return useCallback(() => {
    if (getLastScrolledAt() > Date.now() - lastScrollWindowDuration) {
      return true;
    }

    if (getRecentFetchCount() > recentFetchCountThreshold) {
      return true;
    }

    return false;
  }, [getLastScrolledAt, getRecentFetchCount]);
};

export { useCheckIfShouldSkipOptimisticPrefetch };
