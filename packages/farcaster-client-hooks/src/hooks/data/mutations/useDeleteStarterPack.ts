import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { StarterPacksCache } from '../../../types';
import { buildStarterPacksKey } from '../queries/starterPacks/buildStarterPacksKey';

const useDeleteStarterPack = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  return useCallback(
    async ({ fid, id }: { fid: number; id: string }) => {
      try {
        await apiClient.deleteStarterPack({
          id: id,
        });

        qc.setQueryData<StarterPacksCache>(
          buildStarterPacksKey({ fid }),
          (data) => {
            if (!data) {
              return;
            }

            const { pages, pageParams } = data;

            const updatedPages = pages.map(
              ({ next, result: { starterPacks } }) => {
                const filtered = starterPacks.filter((sp) => sp.id !== id);

                return {
                  next: next,
                  result: {
                    starterPacks: filtered,
                  },
                };
              },
            );

            return { pageParams, pages: updatedPages };
          },
        );
      } catch (error) {
        throw error;
      }
    },
    [apiClient, qc],
  );
};

export { useDeleteStarterPack };
