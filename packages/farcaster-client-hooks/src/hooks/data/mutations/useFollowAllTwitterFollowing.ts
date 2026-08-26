import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { TwitterFollowingUsersCache } from '../../../types';
import { useOptimisticallyUpdateUser } from '../optimistic';
import { buildTwitterFollowingKey } from '../queries/twitterFollowing/buildTwitterFollowingKey';

const useFollowAllTwitterFollowing = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(async () => {
    try {
      qc.setQueryData<TwitterFollowingUsersCache>(
        buildTwitterFollowingKey(),
        (data) => {
          if (!data) {
            return;
          }

          const { pages, pageParams } = data;

          const updatedPages = pages.map(
            ({ next, result: { following, totalMatchCount } }) => {
              return {
                next: next,
                result: {
                  following,
                  alreadyFollowingCount: totalMatchCount,
                  totalMatchCount,
                },
              };
            },
          );

          return { pageParams, pages: updatedPages };
        },
      );

      const qd = qc.getQueryData<TwitterFollowingUsersCache>(
        buildTwitterFollowingKey(),
      );

      if (typeof qd !== 'undefined') {
        const users = qd.pages.flatMap((page) => page.result.following);
        for (const user of users) {
          optimisticallyUpdateUser({
            updates: {
              fid: user.fid,
              followerCount: user.followerCount + 1,
              viewerContext: {
                following: true,
              },
            },
            revertUpdates: {
              fid: user.fid,
              followerCount: user.followerCount,
              viewerContext: {
                following:
                  typeof user.viewerContext !== 'undefined' &&
                  user.viewerContext.following,
              },
            },
          });
        }
      }

      await apiClient.followAllTwitterFollowing();
    } catch (error) {
      throw error;
    }
  }, [apiClient, optimisticallyUpdateUser, qc]);
};

export { useFollowAllTwitterFollowing };
