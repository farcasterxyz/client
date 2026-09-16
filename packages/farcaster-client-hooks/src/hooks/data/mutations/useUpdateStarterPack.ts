import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateStarterPack } from '../queries/starterPack/useInvalidateStarterPack';
import { useInvalidateStarterPacks } from '../queries/starterPacks/useInvalidateStarterPacks';
import { useInvalidateStarterPackUsers } from '../queries/starterPackUsers/useInvalidateStarterPackUsers';

const useUpdateStarterPack = () => {
  const { apiClient } = useFarcasterApiClient();

  const invalidateStarterPacks = useInvalidateStarterPacks();
  const invalidateStarterPack = useInvalidateStarterPack();
  const invalidateStarterPackUsers = useInvalidateStarterPackUsers();

  return useCallback(
    async ({
      fid,
      id,
      name,
      description,
      fids,
      labels,
    }: {
      fid: number;
      id: string;
      name: string;
      description: string;
      fids: number[];
      labels: string[];
    }) => {
      try {
        await apiClient.updateStarterPack({
          id: id,
          name: name,
          description: description,
          fids: fids,
          labels: labels,
        });

        invalidateStarterPack({ id });
        invalidateStarterPacks({ fid });
        invalidateStarterPackUsers({ id });
      } catch (error) {
        throw error;
      }
    },
    [
      apiClient,
      invalidateStarterPack,
      invalidateStarterPackUsers,
      invalidateStarterPacks,
    ],
  );
};

export { useUpdateStarterPack };
