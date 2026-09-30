import { ApiChannel } from 'farcaster-client-data';
import {
  useCreateFeedFollow,
  useDeleteFeedFollow,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

export const useFollowChannel = (channel: ApiChannel, location: string) => {
  const currentUser = useCurrentUser_UNSAFE();
  const createFeedFollow = useCreateFeedFollow();
  const deleteFeedFollow = useDeleteFeedFollow();

  const isFollowing = channel.viewerContext.following;

  const followChannel = useCallback(async () => {
    await createFeedFollow({
      feedKey: channel.key,
      following: isFollowing,
      location,
    });
  }, [createFeedFollow, channel.key, isFollowing, location]);

  const unfollowChannel = useCallback(async () => {
    await deleteFeedFollow({
      feedKey: channel.key,
      fid: currentUser.fid,
      following: isFollowing,
      location,
    });
  }, [deleteFeedFollow, channel.key, currentUser.fid, isFollowing, location]);

  return {
    isFollowing,
    toggleFollowing: isFollowing ? unfollowChannel : followChannel,
  };
};
