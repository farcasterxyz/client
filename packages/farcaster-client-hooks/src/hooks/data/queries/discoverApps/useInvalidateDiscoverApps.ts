import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDiscoveryAppCategory,
  ApiDiscoveryAppList,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDiscoverAppsKey } from './buildDiscoverAppsKey';

const useInvalidateDiscoverApps = ({
  list,
  categoryFilter,
}: {
  list: ApiDiscoveryAppList;
  categoryFilter?: ApiDiscoveryAppCategory;
}) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildDiscoverAppsKey({ list, categoryFilter }),
    });
  }, [queryClient, list, categoryFilter]);
};

export { useInvalidateDiscoverApps };
