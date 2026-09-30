import { ApiChannel } from 'farcaster-client-data';
import {
  UnableToFollowFeedError,
  useCreateFeedFollow,
  useDeleteFeedFollow,
  useInvalidateChannel,
  useInvalidateDiscoverChannels,
  useInvalidateUserFollowingChannels,
  useRefetchFeedSummaries,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo, useState } from 'react';
import { useToast } from 'react-native-toast-notifications';

import { Button } from '~/components/Button';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';
import { trackError } from '~/utils/ErrorUtils';

type FeedFollowButtonProps = {
  channel: ApiChannel;
  isViewerFollowing: boolean;
  // used in analytics to determine location of action
  location: string;
  variant?: 'default' | 'icon' | 'large';
  onClickCallback?: (followed: boolean) => void;
};

const FEED_FOLLOW_BUTTON_WITH_TEXT_MIN_WIDTH = 94;

const FeedFollowButton: FC<FeedFollowButtonProps> = memo(
  ({
    channel,
    isViewerFollowing,
    variant = 'default',
    onClickCallback,
    location,
  }) => {
    const t = useTheme();
    const currentUser = useGloballyCachedCurrentUser();

    const createFeedFollow = useCreateFeedFollow();
    const deleteFeedFollow = useDeleteFeedFollow();

    const refetchFeedSummaries = useRefetchFeedSummaries();
    const invalidateUserFollowingChannels =
      useInvalidateUserFollowingChannels();
    const invalidateDiscoverChannels = useInvalidateDiscoverChannels();
    const invalidateChannel = useInvalidateChannel();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const toast = useToast();

    const { title, icon, minWidth } = useMemo(() => {
      if (variant === 'default' || variant === 'large') {
        return {
          title: isViewerFollowing ? 'Following' : 'Follow',
          icon: undefined,
          minWidth: FEED_FOLLOW_BUTTON_WITH_TEXT_MIN_WIDTH,
        };
      } else {
        return {
          title: '',
          icon: isViewerFollowing ? 'check' : 'plus',
          minWidth: 20,
        };
      }
    }, [isViewerFollowing, variant]);

    const buttonVariant = useMemo(() => {
      return isViewerFollowing || isSubmitting ? 'muted' : 'normal';
    }, [isViewerFollowing, isSubmitting]);

    const onFollowPress = React.useCallback(async () => {
      setIsSubmitting(true);

      try {
        if (isViewerFollowing) {
          await deleteFeedFollow({
            feedKey: channel.key,
            following: channel.viewerContext.following,
            fid: currentUser.fid,
            location,
          });
        } else {
          await createFeedFollow({
            feedKey: channel.key,
            following: channel.viewerContext.following,
            location,
          });
        }

        await Promise.all([
          refetchFeedSummaries(),
          invalidateUserFollowingChannels(),
          invalidateDiscoverChannels(),
          invalidateChannel({ key: channel.key }),
        ]);
      } catch (error) {
        toast.show('Unable to follow feed', { type: 'danger' });

        trackError(
          new UnableToFollowFeedError({
            followerFid: currentUser.fid,
            feedKey: channel.key,
            follow: !isViewerFollowing,
            error,
          }),
        );
      } finally {
        setIsSubmitting(false);
      }

      if (onClickCallback) {
        onClickCallback(!isViewerFollowing);
      }
    }, [
      onClickCallback,
      isViewerFollowing,
      refetchFeedSummaries,
      invalidateUserFollowingChannels,
      currentUser.fid,
      invalidateDiscoverChannels,
      invalidateChannel,
      channel.key,
      channel.viewerContext.following,
      deleteFeedFollow,
      location,
      createFeedFollow,
      toast,
    ]);

    return (
      <Button
        title={title}
        materialCommunityIconName={icon}
        size="xs"
        loading={isSubmitting}
        minWidth={minWidth}
        onPress={onFollowPress}
        variant={buttonVariant}
        fullWidth={variant === 'large'}
        style={variant === 'large' ? [t.h10, t.roundedLg] : undefined}
        textStyle={variant === 'large' ? [{ fontSize: 16 }] : undefined}
      />
    );
  },
);

FeedFollowButton.displayName = 'FollowButton';

export { FEED_FOLLOW_BUTTON_WITH_TEXT_MIN_WIDTH, FeedFollowButton };
