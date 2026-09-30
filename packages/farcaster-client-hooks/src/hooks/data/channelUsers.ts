import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { ApiChannelUser, ApiUserAppContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  removeItemFromPaginatedResultCaches,
  updateItemInPaginatedResultCaches,
} from './helpers';
import { useInvalidateChannel } from './queries/channel/useInvalidateChannel';
import { buildChannelUsersKey } from './queries/channelUsers/buildChannelUsersKey';
import { buildChannelUsersForInviteKey } from './queries/channelUsersForInvite/buildChannelUsersForInviteKey';
import { buildChannelUsersForManagementKey } from './queries/channelUsersForManagement/buildChannelUsersForManagementKey';
import { useInvalidateDiscoverChannels } from './queries/discoverChannels/useInvalidateDiscoverChannels';
import { useInvalidateFeedSummaries } from './queries/feedSummaries/useInvalidateFeedSummaries';
import { useGetGloballyCachedChannel } from './queries/globallyCachedChannel/useGetGloballyCachedChannel';
import { useMergeIntoGloballyCachedChannel } from './queries/globallyCachedChannel/useMergeIntoGloballyCachedChannel';
import { useInvalidateHighlightedChannels } from './queries/highlightedChannels/useInvalidateHighlightedChannels';
import { buildUserAppContextKey } from './queries/userAppContext/buildUserAppContextKey';
import { useInvalidateUserFollowingChannels } from './queries/userFollowingChannels/useInvalidateUserFollowingChannels';

export const apiChannelUserKeyExtractor = (item: ApiChannelUser) => {
  return item.user.fid.toString();
};

export const removeChannelMemberFromCache = ({
  queryClient,
  channelKey,
  fid,
}: {
  queryClient: QueryClient;
  channelKey: string;
  fid: number;
}) => {
  removeItemFromPaginatedResultCaches({
    queryClient,
    queryKey: buildChannelUsersKey({ channelKey, filterToMembers: true }),
    keyExtractor: apiChannelUserKeyExtractor,
    removeKey: fid.toString(),
  });

  removeItemFromPaginatedResultCaches({
    queryClient,
    queryKey: buildChannelUsersForManagementKey({ channelKey }),
    keyExtractor: apiChannelUserKeyExtractor,
    removeKey: fid.toString(),
  });
};

export const updateChannelUserInCache = ({
  queryClient,
  channelKey,
  fid,
  update,
}: {
  queryClient: QueryClient;
  channelKey: string;
  fid: number;
  update: (channelUser: ApiChannelUser) => ApiChannelUser;
}) => {
  updateItemInPaginatedResultCaches({
    queryClient,
    queryKey: buildChannelUsersKey({ channelKey }),
    keyExtractor: apiChannelUserKeyExtractor,
    updateKey: fid.toString(),
    update,
  });

  updateItemInPaginatedResultCaches({
    queryClient,
    queryKey: buildChannelUsersForManagementKey({ channelKey }),
    keyExtractor: apiChannelUserKeyExtractor,
    updateKey: fid.toString(),
    update,
  });

  updateItemInPaginatedResultCaches({
    queryClient,
    queryKey: buildChannelUsersForInviteKey({ channelKey }),
    keyExtractor: apiChannelUserKeyExtractor,
    updateKey: fid.toString(),
    update,
  });
};

export const invalidateChannelUsersQueries = ({
  queryClient,
  channelKey,
}: {
  queryClient: QueryClient;
  channelKey: string;
}) => {
  queryClient.invalidateQueries({
    queryKey: buildChannelUsersKey({ channelKey }),
  });

  queryClient.invalidateQueries({
    queryKey: buildChannelUsersForManagementKey({ channelKey }),
  });

  queryClient.invalidateQueries({
    queryKey: buildChannelUsersForInviteKey({ channelKey }),
  });
};

export const useOptimisticallyAddSelfInRole = () => {
  const queryClient = useQueryClient();
  const optimisticallyFollowFeed = useOptimisticallyFollowFeed();
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();
  const invalidateChannel = useInvalidateChannel();

  return useCallback(
    async <TReturn>({
      channelKey,
      role,
      execute,
    }: {
      channelKey: string;
      role: 'owner' | 'moderator' | 'member';
      execute: () => Promise<TReturn>;
    }): Promise<TReturn> => {
      mergeIntoGloballyCachedChannel({
        updates: {
          key: channelKey,
          viewerContext: {
            isMember: true,
          },
        },
      });

      if (role === 'moderator') {
        queryClient.setQueryData<ApiUserAppContext>(
          buildUserAppContextKey(),
          (data) => {
            if (!data) {
              return;
            }

            const prev = data.modOfChannelKeys ?? [];
            const next = [...prev, channelKey];
            return {
              ...data,
              modOfChannelKeys: next,
            };
          },
        );
      }

      if (role === 'owner') {
        queryClient.setQueryData<ApiUserAppContext>(
          buildUserAppContextKey(),
          (data) => {
            if (!data) {
              return;
            }

            const prev = data.adminForChannelKeys ?? [];
            const next = [...prev, channelKey];
            return {
              ...data,
              adminForChannelKeys: next,
            };
          },
        );
      }

      try {
        const result = await optimisticallyFollowFeed({
          feedKey: channelKey,
          execute,
        });

        void invalidateChannel({ key: channelKey });
        void invalidateChannelUsersQueries({
          queryClient,
          channelKey,
        });

        return result;
      } catch (e) {
        mergeIntoGloballyCachedChannel({
          updates: {
            key: channelKey,
            viewerContext: {
              isMember: false,
            },
          },
        });

        if (role === 'moderator') {
          queryClient.setQueryData<ApiUserAppContext>(
            buildUserAppContextKey(),
            (data) => {
              if (!data) {
                return;
              }

              const prev = data.modOfChannelKeys ?? [];
              const next = prev.filter((key) => key !== channelKey);

              return {
                ...data,
                modOfChannelKeys: next,
              };
            },
          );
        }

        if (role === 'owner') {
          queryClient.setQueryData<ApiUserAppContext>(
            buildUserAppContextKey(),
            (data) => {
              if (!data) {
                return;
              }

              const prev = data.adminForChannelKeys ?? [];
              const next = prev.filter((key) => key !== channelKey);

              return {
                ...data,
                adminForChannelKeys: next,
              };
            },
          );
        }

        void invalidateChannel({ key: channelKey });

        throw e;
      }
    },
    [
      queryClient,
      mergeIntoGloballyCachedChannel,
      optimisticallyFollowFeed,
      invalidateChannel,
    ],
  );
};

export const useOptimisticallyFollowFeed = () => {
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();
  const invalidateHighlightedChannels = useInvalidateHighlightedChannels();
  const invalidateChannel = useInvalidateChannel();
  const invalidateUserFollowingChannels = useInvalidateUserFollowingChannels();
  const invalidateDiscoverChannels = useInvalidateDiscoverChannels();
  const invalidateFeedSummaries = useInvalidateFeedSummaries();

  const getGloballyCachedChannel = useGetGloballyCachedChannel();

  return useCallback(
    async <TReturn>({
      feedKey,
      following,
      execute,
    }: {
      feedKey: string;
      following?: boolean;
      execute: () => Promise<TReturn>;
    }): Promise<TReturn> => {
      const cachedChannel = getGloballyCachedChannel({
        key: feedKey,
      });

      mergeIntoGloballyCachedChannel({
        updates: {
          key: feedKey,
          viewerContext: {
            following: true,
          },
        },
      });

      try {
        const result = await execute();

        void Promise.all([
          invalidateFeedSummaries(),
          invalidateUserFollowingChannels(),
          invalidateDiscoverChannels(),
          invalidateChannel({ key: feedKey }),
        ]);

        // Backend updates this async, so wait a bit
        setTimeout(() => {
          void invalidateHighlightedChannels();
        }, 2000);

        return result;
      } catch (error) {
        mergeIntoGloballyCachedChannel({
          updates: {
            key: feedKey,
            viewerContext: {
              following: following ?? cachedChannel?.viewerContext.following,
            },
          },
        });

        // we can't be sure we set their following status accurately
        // so we invalidate the channel
        void invalidateChannel({ key: feedKey });

        throw error;
      }
    },
    [
      getGloballyCachedChannel,
      invalidateChannel,
      invalidateDiscoverChannels,
      invalidateFeedSummaries,
      invalidateHighlightedChannels,
      invalidateUserFollowingChannels,
      mergeIntoGloballyCachedChannel,
    ],
  );
};
