import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel } from 'farcaster-client-data';
import {
  useCreateFeedFollow,
  useDeleteFeedFollow,
  useGloballyCachedChannel,
  useInvalidateChannel,
  useInvalidateDiscoverChannels,
  useInvalidateSuggestedChannels,
  useInvalidateUserFollowingChannels,
  useRefetchFeedSummaries,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { trackError } from '~/utils/errorUtils';

type FollowChannelButtonProps = {
  channel: ApiChannel;
  onClickCallback?: (followed: boolean) => void;
  style?: 'default' | 'inverted-small';
  className?: string;
};

const FollowChannelButton: FC<FollowChannelButtonProps> = memo((props) => {
  const isSignedIn = useIsSignedIn();

  if (!isSignedIn) {
    return null;
  }

  return <AuthenticatedFollowChannelButtonContent {...props} />;
});

FollowChannelButton.displayName = 'FollowChannelButton';

const AuthenticatedFollowChannelButtonContent: FC<FollowChannelButtonProps> =
  memo(
    ({
      channel: fallbackChannel,
      onClickCallback,
      style = 'default',
      className,
    }) => {
      const channel = useGloballyCachedChannel({ fallback: fallbackChannel });
      const { trackEvent } = useTrackEvent();
      const { fid } = useCurrentUser();

      const createFeedFollow = useCreateFeedFollow();
      const deleteFeedFollow = useDeleteFeedFollow();

      const refetchFeedSummaries = useRefetchFeedSummaries();
      const invalidateUserFollowingChannels =
        useInvalidateUserFollowingChannels();
      const invalidateDiscoverChannels = useInvalidateDiscoverChannels();
      const invalidateSuggestedChannels = useInvalidateSuggestedChannels();
      const invalidateChannel = useInvalidateChannel();

      const [isSubmitting, setIsSubmitting] = useState(false);

      const isViewerFollowing = useMemo(() => {
        return channel.viewerContext.following;
      }, [channel.viewerContext.following]);

      const variant = useMemo(() => {
        return style === 'default'
          ? isViewerFollowing
            ? 'muted'
            : 'normal'
          : isViewerFollowing
            ? 'muted'
            : 'inverted';
      }, [isViewerFollowing, style]);

      return (
        <DefaultButton
          // Why do we need the z-index: 5 here?
          // This is due to user rows containing an absolute click listener overlay.
          // Any clicks are bypassed so navigation to profiles occur.
          // Due to this, we have to apply z-index to the follow button.
          className={cn(
            'h-min subtle-hover-z text-default',
            style === 'default' && 'w-[96px]',
            className,
            'flex w-full flex-row items-center !justify-center gap-2 !font-semibold text-default',
            isViewerFollowing ? 'bg-elevated' : '',
          )}
          isLoading={isSubmitting}
          size="md"
          variant={variant}
          onClick={async (e: React.SyntheticEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();

            setIsSubmitting(true);

            trackEvent(AnalyticsEvent.FollowChannel, {
              channel: channel.key,
              'is remove': isViewerFollowing,
            });

            try {
              if (isViewerFollowing) {
                await deleteFeedFollow({
                  feedKey: channel.key,
                  following: isViewerFollowing,
                  fid,
                });
              } else {
                await createFeedFollow({
                  feedKey: channel.key,
                  following: isViewerFollowing,
                });
              }

              await Promise.all([
                refetchFeedSummaries(),
                invalidateChannel({ key: channel.key }),
                invalidateUserFollowingChannels(),
                invalidateDiscoverChannels(),
                invalidateSuggestedChannels(),
              ]);
            } catch (error) {
              trackError(error);
              alert(error);
            } finally {
              setIsSubmitting(false);
            }

            if (onClickCallback) {
              onClickCallback(!isViewerFollowing);
            }
          }}
        >
          {isViewerFollowing ? 'Following' : 'Follow'}
        </DefaultButton>
      );
    },
  );

AuthenticatedFollowChannelButtonContent.displayName =
  'AuthenticatedFollowChannelButtonContent';

export { FollowChannelButton };
