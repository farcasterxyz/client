import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildChannelDetailsKey } from './buildChannelDetailsKey';

const useInvalidateChannelDetails = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ key }: { key: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildChannelDetailsKey({ key }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateChannelDetails };
