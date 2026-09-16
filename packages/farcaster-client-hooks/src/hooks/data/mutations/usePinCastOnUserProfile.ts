import { useQueryClient } from '@tanstack/react-query';
import { ApiCast } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { UserCastsCache } from '../../../types';
import { useOptimisticallyUpdateCast } from '../optimistic/useOptimisticallyUpdateCast';
import { buildUserCastsKey } from '../queries/userCasts/buildUserCastsKey';
import { buildUserCastsAndRepliesKey } from '../queries/userCastsAndReplies/buildUserCastsAndRepliesKey';

const usePinCastOnUserProfile = () => {
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateCast = useOptimisticallyUpdateCast();
  const qc = useQueryClient();

  return useCallback(
    async ({ cast }: { cast: ApiCast }) => {
      qc.setQueryData<UserCastsCache>(
        buildUserCastsKey({ fid: cast.author.fid }),
        (data) => {
          if (!data) {
            return;
          }

          const { pages, pageParams } = data;

          const updatedPages = pages.map(({ next, result: { casts } }) => {
            const sortedCasts = casts.sort((a, b) => b.timestamp - a.timestamp);

            const existingPinnedCastsInPage = sortedCasts.filter(
              (c) => c.pinned,
            );

            for (const pinnedCast of existingPinnedCastsInPage) {
              optimisticallyUpdateCast({
                updates: {
                  hash: pinnedCast.hash,
                  pinned: false,
                },
                revertUpdates: {
                  hash: pinnedCast.hash,
                  pinned: true,
                },
              });
            }

            const pinnedCastInThisPage =
              sortedCasts.findIndex((c) => c.hash === cast.hash) !== -1;

            if (pinnedCastInThisPage) {
              const nonPinnedCastsInPage = sortedCasts.filter(
                (c) => c.hash !== cast.hash,
              );

              return {
                next: next,
                result: {
                  casts: [{ ...cast, pinned: true }, ...nonPinnedCastsInPage],
                },
              };
            } else {
              return {
                next: next,
                result: {
                  casts: sortedCasts,
                },
              };
            }
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

            const existingPinnedCastsInPage = sortedCasts.filter(
              (c) => c.pinned,
            );

            for (const pinnedCast of existingPinnedCastsInPage) {
              optimisticallyUpdateCast({
                updates: {
                  hash: pinnedCast.hash,
                  pinned: false,
                },
                revertUpdates: {
                  hash: pinnedCast.hash,
                  pinned: true,
                },
              });
            }

            const pinnedCastInThisPage =
              sortedCasts.findIndex((c) => c.hash === cast.hash) !== -1;

            if (pinnedCastInThisPage) {
              const nonPinnedCastsInPage = sortedCasts.filter(
                (c) => c.hash !== cast.hash,
              );

              return {
                next: next,
                result: {
                  casts: [{ ...cast, pinned: true }, ...nonPinnedCastsInPage],
                },
              };
            } else {
              return {
                next: next,
                result: {
                  casts: sortedCasts,
                },
              };
            }
          });

          return { pageParams, pages: updatedPages };
        },
      );

      const revertOptimisticUpdates = optimisticallyUpdateCast({
        updates: {
          hash: cast.hash,
          pinned: true,
        },
        revertUpdates: {
          hash: cast.hash,
          pinned: false,
        },
      });

      try {
        await apiClient.pinCastOnUserProfile({
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

export { usePinCastOnUserProfile };
