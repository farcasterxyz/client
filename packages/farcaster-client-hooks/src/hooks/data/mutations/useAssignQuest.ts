import { ApiQuestType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useAssignQuest = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (userFid: number, questType: ApiQuestType) => {
      const { data } = await apiClient.assignQuestForUser({
        userFid,
        questType,
      });
      return data.result;
    },

    [apiClient],
  );
};
