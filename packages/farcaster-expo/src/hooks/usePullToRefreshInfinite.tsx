import { useState } from 'react';

import { useRefreshControl } from './useRefreshControl';

const usePullToRefreshInfinite = ({
  refetch,
  offset,
}: {
  refetch: () => Promise<unknown>;
  offset?: number;
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshControl = useRefreshControl({
    refetch,
    isRefreshing,
    setIsRefreshing,
    offset,
  });

  return { refreshControl, isRefreshing, setIsRefreshing };
};

export { usePullToRefreshInfinite };
