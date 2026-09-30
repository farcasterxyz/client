import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildGloballyCachedUserKey } from '../queries/globallyCachedUser/buildGloballyCachedUserKey';

export const useClaimQuestReward = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  const claimQuestReward = useCallback(
    async (questId: string, userFid: number) => {
      const { data } = await apiClient.claimQuestReward({
        questId,
      });
      queryClient.invalidateQueries({
        queryKey: buildGloballyCachedUserKey({ fid: userFid }),
      });
      return data.result;
    },

    [apiClient, queryClient],
  );

  return { claimQuestReward };
};
