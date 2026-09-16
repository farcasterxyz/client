import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildPollResultsKey } from './buildPollResultsKey';

const useInvalidatePollResults = ({ url }: { url: string }) => {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: buildPollResultsKey({ url }),
    });
  }, [queryClient, url]);
};

export { useInvalidatePollResults };
