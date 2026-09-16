import { useQueryClient } from '@tanstack/react-query';
import { ApiUser, ApiUserAppContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import { DeleteFollowError } from '../../../errors';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useOptimisticallyUpdateUser } from '../optimistic/useOptimisticallyUpdateUser';
import { buildUserAppContextKey } from '../queries/userAppContext/buildUserAppContextKey';

const useDeleteFollow = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const optimisticallyUpdateUser = useOptimisticallyUpdateUser();

  return useCallback(
    async ({
      followee,
      follower,
    }: {
      followee: ApiUser;
      follower: ApiUser;
    }) => {
      const revertFollowerUpdate = optimisticallyUpdateUser({
        updates: {
          fid: follower.fid,
          followingCount: Math.max(0, follower.followingCount - 1),
        },
        revertUpdates: {
          fid: follower.fid,
          followingCount: follower.followingCount,
        },
      });

      const revertFolloweeUpdates = optimisticallyUpdateUser({
        updates: {
          fid: followee.fid,
          followerCount: Math.max(0, followee.followerCount - 1),
          viewerContext: {
            following: false,
          },
        },
        revertUpdates: {
          fid: followee.fid,
          followerCount: followee.followerCount,
          viewerContext: {
            following: followee.viewerContext?.following,
          },
        },
      });

      try {
        const { data } = await apiClient.deleteFollow({
          targetFid: followee.fid,
        });

        const userAppContextKey = buildUserAppContextKey();
        queryClient.setQueryData(
          userAppContextKey,
          (prev: ApiUserAppContext | undefined) =>
            prev
              ? {
                  ...prev,
                  canAddLinks: data.result.userAppContext.canAddLinks,
                }
              : undefined,
        );
      } catch (error) {
        revertFollowerUpdate();
        revertFolloweeUpdates();

        throw new DeleteFollowError({
          error,
          followeeFid: followee.fid,
          followerFid: follower.fid,
        });
      }
    },
    [queryClient, apiClient, optimisticallyUpdateUser],
  );
};

export { useDeleteFollow };
