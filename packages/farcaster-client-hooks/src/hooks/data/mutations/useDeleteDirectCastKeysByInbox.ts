import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateDirectCastKeysByAccount } from '../queries/directCastKeysByAccount/useInvalidateDirectCastKeysByAccount';

const useDeleteDirectCastKeysByInbox = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDirectCastKeysByAccount =
    useInvalidateDirectCastKeysByAccount();

  return useCallback(
    async ({ fid, inboxId }: { fid: number; inboxId: string }) => {
      await apiClient.deleteDirectCastKeysByInbox({ inboxId });
      invalidateDirectCastKeysByAccount({ fid });
    },
    [apiClient, invalidateDirectCastKeysByAccount],
  );
};

export { useDeleteDirectCastKeysByInbox };
