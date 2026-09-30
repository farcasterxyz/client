import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildTrendingTopicsKey } from './buildTrendingTopicsKey';
import { useInvalidateTrendingTopics } from './useInvalidateTrendingTopics';
import { useTrendingTopics } from './useTrendingTopics';

const useTrendingTopicsWithRefreshOnMount = () => {
  const initialValue = useTrendingTopics();

  const queryKey = useMemo(() => buildTrendingTopicsKey(), []);

  const invalidateTrendingTopics = useInvalidateTrendingTopics();

  const invalidate = useCallback(() => {
    invalidateTrendingTopics();
  }, [invalidateTrendingTopics]);

  return useQueryWithRefreshOnMount({
    invalidate,
    initialValue,
    queryKey,
  });
};

export { useTrendingTopicsWithRefreshOnMount };
