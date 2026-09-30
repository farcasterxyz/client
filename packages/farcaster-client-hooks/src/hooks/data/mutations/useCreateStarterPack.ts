import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { StarterPackCache, StarterPacksCache } from '../../../types';
import { buildStarterPackKey } from '../queries/starterPack/buildStarterPackKey';
import { buildStarterPacksKey } from '../queries/starterPacks/buildStarterPacksKey';

const useCreateStarterPack = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  return useCallback(
    async ({
      fid,
      name,
      description,
      fids,
      labels,
    }: {
      fid: number;
      name: string;
      description: string;
      fids: number[];
      labels: string[];
    }) => {
      try {
        const response = await apiClient.createStarterPack({
          name: name,
          description: description,
          fids: fids,
          labels: labels,
        });

        const starterPack = response.data.result.starterPack;

        qc.setQueryData<StarterPackCache>(
          buildStarterPackKey({ id: starterPack.id }),
          () => {
            return { starterPack };
          },
        );

        qc.setQueryData<StarterPacksCache>(
          buildStarterPacksKey({ fid }),
          (data) => {
            if (!data) {
              return;
            }

            const { pages, pageParams } = data;

            const updatedPages = pages.map(
              ({ next, result: { starterPacks } }, index) => {
                if (index === 0) {
                  return {
                    next: next,
                    result: {
                      starterPacks: [starterPack, ...starterPacks],
                    },
                  };
                } else {
                  return {
                    next: next,
                    result: {
                      starterPacks: starterPacks,
                    },
                  };
                }
              },
            );

            return { pageParams, pages: updatedPages };
          },
        );

        return response.data.result.starterPack;
      } catch (error) {
        throw error;
      }
    },
    [apiClient, qc],
  );
};

export { useCreateStarterPack };
