import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildHighlightedChannelsKey } from './buildHighlightedChannelsKey';

const usePurgeHighlightedChannels = () => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.removeQueries({
      queryKey: buildHighlightedChannelsKey(),
    });
  }, [queryClient]);
};

export { usePurgeHighlightedChannels };
