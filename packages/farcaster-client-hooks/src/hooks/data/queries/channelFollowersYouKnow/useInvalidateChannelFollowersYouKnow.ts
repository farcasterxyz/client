import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildChannelFollowersYouKnowKey } from './buildChannelFollowersYouKnowKey';

const useInvalidateChannelFollowersYouKnow = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ channelKey, limit }: { channelKey: string; limit: number }) => {
      queryClient.invalidateQueries({
        queryKey: buildChannelFollowersYouKnowKey({ channelKey, limit }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateChannelFollowersYouKnow };
