import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildCampaignKey } from './buildCampaignKey';

const useInvalidateCampaign = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ id }: { id: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildCampaignKey({ id }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateCampaign };
