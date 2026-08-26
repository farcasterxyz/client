import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDiscoveryFrameCategory,
  ApiDiscoveryFrameList,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDiscoverFramesKey } from './buildDiscoverFramesKey';

const useInvalidateDiscoverFrames = ({
  list,
  categoryFilter,
}: {
  list: ApiDiscoveryFrameList;
  categoryFilter?: ApiDiscoveryFrameCategory;
}) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildDiscoverFramesKey({ list, categoryFilter }),
    });
  }, [queryClient, list, categoryFilter]);
};

export { useInvalidateDiscoverFrames };
