import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildSuggestedChannelsKey } from './buildSuggestedChannelsKey';

const useInvalidateSuggestedChannels = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildSuggestedChannelsKey({ limit: undefined }),
    });
  }, [queryClient]);
};

export { useInvalidateSuggestedChannels };
