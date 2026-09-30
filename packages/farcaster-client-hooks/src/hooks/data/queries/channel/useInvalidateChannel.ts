import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildChannelKey } from './buildChannelKey';

const useInvalidateChannel = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ key }: { key: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildChannelKey({ key }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateChannel };
