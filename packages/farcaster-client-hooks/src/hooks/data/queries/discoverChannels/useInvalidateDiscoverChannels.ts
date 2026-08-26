import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildDiscoverChannelsKey } from './buildDiscoverChannelsKey';

const useInvalidateDiscoverChannels = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildDiscoverChannelsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateDiscoverChannels };
