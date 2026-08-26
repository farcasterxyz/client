import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateDirectCastInboxByAccount } from '../queries/directCastInbox/useInvalidateDirectCastInboxByAccount';

const useCreatePlaintextDirectCastGroup = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDirectCastInboxByAccount =
    useInvalidateDirectCastInboxByAccount();

  return useCallback(
    async ({
      fid,
      participantFids,
      name,
    }: {
      fid: number;
      participantFids: number[];
      name: string;
    }) => {
      const { data } = await apiClient.putDirectCastGroupV3({
        participantFids,
        name,
      });
      invalidateDirectCastInboxByAccount({
        fid,
        category: 'default',
      });
      return data;
    },
    [apiClient, invalidateDirectCastInboxByAccount],
  );
};

export { useCreatePlaintextDirectCastGroup };
