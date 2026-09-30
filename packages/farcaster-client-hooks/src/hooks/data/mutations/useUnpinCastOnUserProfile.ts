import { useQueryClient } from '@tanstack/react-query';
import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { UserCastsCache } from '../../../types';
import { useOptimisticallyUpdateCast } from '../optimistic/useOptimisticallyUpdateCast';
import { buildUserCastsKey } from '../queries/userCasts/buildUserCastsKey';
import { buildUserCastsAndRepliesKey } from '../queries/userCastsAndReplies/buildUserCastsAndRepliesKey';

const useUnpinCastOnUserProfile = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();
  const qc = useQueryClient();

  return useCallback(
    async ({ cast }: { cast: ApiCast }) => {
      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          pinned: false,
        },
        revertUpdates: {
          hash: cast.hash,
          pinned: true,
        },
      });

      qc.setQueryData<UserCastsCache>(
        buildUserCastsKey({ fid: cast.author.fid }),
        (data) => {
          if (!data) {
            return;
          }

          const { pages, pageParams } = data;

          const updatedPages = pages.map(({ next, result: { casts } }) => {
            const sortedCasts = casts.sort((a, b) => b.timestamp - a.timestamp);

            return {
              next: next,
              result: {
                casts: sortedCasts,
              },
            };
          });

          return { pageParams, pages: updatedPages };
        },
      );

      qc.setQueryData<UserCastsCache>(
        buildUserCastsAndRepliesKey({ fid: cast.author.fid }),
        (data) => {
          if (!data) {
            return;
          }

          const { pages, pageParams } = data;

          const updatedPages = pages.map(({ next, result: { casts } }) => {
            const sortedCasts = casts.sort((a, b) => b.timestamp - a.timestamp);

            return {
              next: next,
              result: {
                casts: sortedCasts,
              },
            };
          });

          return { pageParams, pages: updatedPages };
        },
      );

      try {
        await apiClient.unpinCastOnUserProfile({
          castHash: cast.hash,
        });
      } catch (error) {
        revertOptimisticUpdates();
        throw error;
      }
    },
    [apiClient, optimisticallyUpdateCast, qc],
  );
};

export { useUnpinCastOnUserProfile };
