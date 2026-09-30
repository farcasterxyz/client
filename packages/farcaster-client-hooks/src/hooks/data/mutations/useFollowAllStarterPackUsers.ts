import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { StarterPackUsersCache } from '../../../types';
import { useOptimisticallyUpdateUser } from '../optimistic';
import { buildStarterPackUsersKey } from '../queries/starterPackUsers/buildStarterPackUsersKey';

const useFollowAllStarterPackUsers = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(
    async ({ id }: { id: string }) => {
      try {
        const starterPackUsersQD = qc.getQueryData<StarterPackUsersCache>(
          buildStarterPackUsersKey({ id }),
        );

        if (typeof starterPackUsersQD !== 'undefined') {
          const starterPackUsers = starterPackUsersQD.pages.flatMap(
            (page) => page.result.users,
          );
          for (const spu of starterPackUsers) {
            optimisticallyUpdateUser({
              updates: {
                fid: spu.fid,
                followerCount: spu.followerCount + 1,
                viewerContext: {
                  following: true,
                },
              },
              revertUpdates: {
                fid: spu.fid,
                followerCount: spu.followerCount,
                viewerContext: {
                  following:
                    typeof spu.viewerContext !== 'undefined' &&
                    spu.viewerContext.following,
                },
              },
            });
          }
        }

        await apiClient.followAllStarterPackUsers({
          id,
        });
      } catch (error) {
        throw error;
      }
    },
    [apiClient, optimisticallyUpdateUser, qc],
  );
};

export { useFollowAllStarterPackUsers };
