import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserFollowingChannelsKey } from './buildUserFollowingChannelsKey';

const useInvalidateUserFollowingChannels = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildUserFollowingChannelsKey({}),
    });
  }, [queryClient]);
};

export { useInvalidateUserFollowingChannels };
