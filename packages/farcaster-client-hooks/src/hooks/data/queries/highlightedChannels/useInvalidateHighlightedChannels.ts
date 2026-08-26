import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildHighlightedChannelsKey } from './buildHighlightedChannelsKey';

const useInvalidateHighlightedChannels = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: buildHighlightedChannelsKey(),
    });
  }, [queryClient]);
};

export { useInvalidateHighlightedChannels };
