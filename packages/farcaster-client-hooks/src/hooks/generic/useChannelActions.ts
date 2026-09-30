import { ApiChannel } from 'farcaster-client-data';
import { useCallback } from 'react';

import {
  useAddFavoriteFeed,
  useCreateFeedFollow,
  useDeleteFeedFollow,
  useDisableChannelNotifications,
  useEnableChannelNotifications,
  useRemoveChannelMember,
  useRemoveChannelModerator,
  useRemoveFavoriteFeed,
} from '../data/';

export const useChannelActions = ({
  channel,
  fid,
  location,
}: {
  channel: ApiChannel;
  fid: number;
  location: string;
}) => {
  const createFeedFollow = useCreateFeedFollow();
  const deleteFeedFollow = useDeleteFeedFollow();
  const addFavoriteFeed = useAddFavoriteFeed();
  const removeFavoriteFeed = useRemoveFavoriteFeed();
  const enablePushNotifications = useEnableChannelNotifications();
  const disablePushNotifications = useDisableChannelNotifications();
  const removeChannelModerator = useRemoveChannelModerator();
  const removeChannelMember = useRemoveChannelMember();

  const favorited = (channel.viewerContext.favoritePosition ?? -1) > 0;
  const following = channel.viewerContext.following;
  const notified = channel.viewerContext.enableNotifications;

  const notify = useCallback(async () => {
    await enablePushNotifications({ channelKey: channel.key });
  }, [enablePushNotifications, channel.key]);

  const doNotNofity = useCallback(async () => {
    disablePushNotifications({ channelKey: channel.key });
  }, [disablePushNotifications, channel.key]);

  const followChannel = useCallback(async () => {
    await createFeedFollow({
      feedKey: channel.key,
      location,
    });
  }, [createFeedFollow, channel.key, location]);

  const unfollowChannel = useCallback(async () => {
    await deleteFeedFollow({
      feedKey: channel.key,
      fid,
      following: following,
      location,
    });
  }, [deleteFeedFollow, channel.key, fid, following, location]);

  const favorite = useCallback(async () => {
    await addFavoriteFeed({ feedKey: channel.key, channel: channel, fid });
  }, [addFavoriteFeed, channel, fid]);

  const unfavorite = useCallback(async () => {
    await removeFavoriteFeed({
      feedKey: channel.key,
      favoritePosition: channel.viewerContext.favoritePosition ?? -1,
      channel,
      fid,
    });
  }, [channel, fid, removeFavoriteFeed]);

  const removeMember = useCallback(async () => {
    await removeChannelMember({
      channelKey: channel.key,
      removeFid: fid,
      actorFid: fid,
    });
  }, [removeChannelMember, channel.key, fid]);

  const removeModerator = useCallback(async () => {
    await removeChannelModerator({
      channelKey: channel.key,
      fid,
      actorFid: fid,
    });
  }, [removeChannelModerator, channel.key, fid]);

  return {
    following,
    toggleFollowing: following ? unfollowChannel : followChannel,
    favorited,
    toggleFavorited: favorited ? unfavorite : favorite,
    notified,
    toggleNotified: notified ? doNotNofity : notify,
    removeMember,
    removeModerator,
  };
};
