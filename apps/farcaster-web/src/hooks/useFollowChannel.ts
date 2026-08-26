import { ApiChannel } from 'farcaster-client-data';
import {
  useAddFavoriteFeed,
  useCreateFeedFollow,
  useDeleteFeedFollow,
  useDisableChannelNotifications,
  useEnableChannelNotifications,
  useRemoveFavoriteFeed,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

export const useFollowChannel = (channel: ApiChannel, location: string) => {
  const currentUser = useCurrentUser();
  const createFeedFollow = useCreateFeedFollow();
  const deleteFeedFollow = useDeleteFeedFollow();

  const following = channel.viewerContext.following;

  const followChannel = useCallback(async () => {
    await createFeedFollow({
      feedKey: channel.key,
      following: following,
      location,
    });
  }, [createFeedFollow, channel.key, following, location]);

  const unfollowChannel = useCallback(async () => {
    await deleteFeedFollow({
      feedKey: channel.key,
      fid: currentUser.fid,
      following: following,
      location,
    });
  }, [deleteFeedFollow, channel.key, currentUser.fid, following, location]);

  return {
    following,
    toggleFollowing: following ? unfollowChannel : followChannel,
  };
};

export const useChannelFavorite = (channel: ApiChannel) => {
  const { fid } = useCurrentUser();

  const addFavoriteFeed = useAddFavoriteFeed();
  const removeFavoriteFeed = useRemoveFavoriteFeed();
  const favorited = (channel.viewerContext.favoritePosition ?? -1) > 0;

  const favorite = useCallback(async () => {
    await addFavoriteFeed({ feedKey: channel.key, channel: channel, fid });
  }, [addFavoriteFeed, channel, fid]);

  const unfavorite = useCallback(async () => {
    await removeFavoriteFeed({
      feedKey: channel.key,
      favoritePosition: channel.viewerContext.favoritePosition ?? -1,
      channel: channel,
      fid,
    });
  }, [channel, fid, removeFavoriteFeed]);

  return {
    favorited,
    toggleFavorited: favorited ? unfavorite : favorite,
  };
};

export const useChannelNotifications = (channel: ApiChannel) => {
  const enablePushNotifications = useEnableChannelNotifications();
  const disablePushNotifications = useDisableChannelNotifications();

  const notified = channel.viewerContext.enableNotifications;

  const notify = useCallback(async () => {
    await enablePushNotifications({ channelKey: channel.key });
  }, [enablePushNotifications, channel.key]);

  const doNotNofity = useCallback(async () => {
    disablePushNotifications({ channelKey: channel.key });
  }, [disablePushNotifications, channel.key]);

  return {
    notified,
    toggleNotifications: notified ? doNotNofity : notify,
  };
};
