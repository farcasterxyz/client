import { PersonAddIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import {
  useCreateFollow,
  useDeleteFollow,
  useGloballyCachedUser,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo, ReactNode, useMemo } from 'react';

import {
  DefaultButton,
  DefaultButtonProps,
} from '~/components/forms/buttons/DefaultButton';
import { FollowsDisabledDetails } from '~/components/popovers/FollowsDisabledDetails';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';
import { trackError } from '~/utils/errorUtils';

type FollowButtonProps = {
  className?: string;
  followText?: ReactNode;
  size?: DefaultButtonProps['size'];
  unfollowText?: ReactNode;
  fullWidth?: boolean;
  user: ApiUser;
  slim?: boolean;
  withDetailsPopover?: boolean;
  inverted?: boolean;
  includeReason?: ApiCastFeedIncludeReason['type'];
  castHash?: string;
};

const FollowButton: FC<FollowButtonProps> = memo((props) => {
  const isSignedIn = useIsSignedIn();

  if (!isSignedIn) {
    return null;
  }

  return <AuthenticatedFollowButtonContent {...props} />;
});

FollowButton.displayName = 'FollowButton';

const AuthenticatedFollowButtonContent: FC<FollowButtonProps> = memo(
  ({
    className,
    followText = 'Follow',
    size = 'md',
    unfollowText = 'Unfollow',
    user: userProp,
    slim = false,
    withDetailsPopover = false,
    inverted = false,
    fullWidth = false,
    includeReason,
    castHash,
  }) => {
    const { trackEvent } = useTrackEvent();
    const user = useGloballyCachedUser({ fallback: userProp });
    const navigateToProfile = useNavigateToProfile();

    const currentUser = useCurrentUser();
    const { disableFollow } = useUserAppContext();

    const createFollow = useCreateFollow();
    const deleteFollow = useDeleteFollow();

    const variant = useMemo(() => {
      return !inverted
        ? slim || user.viewerContext?.following
          ? 'muted'
          : 'normal'
        : user.viewerContext?.following
          ? 'muted'
          : 'inverted';
    }, [inverted, slim, user.viewerContext?.following]);

    const content = useMemo(() => {
      if (slim) {
        return <PersonAddIcon size="small" />;
      }

      return user.viewerContext?.following ? unfollowText : followText;
    }, [followText, slim, unfollowText, user.viewerContext?.following]);

    const disabled = !user.viewerContext?.following && disableFollow;

    const followButtonContent = useMemo(() => {
      return (
        <DefaultButton
          // Why do we need the z-index: 5 here?
          // This is due to user rows containing an absolute click listener overlay.
          // Any clicks are bypassed so navigation to profiles occur.
          // Due to this, we have to apply z-index to the follow button.
          className={classNames(
            'subtle-hover-z',
            fullWidth
              ? 'w-full'
              : size === 'md'
                ? 'min-w-[92px]'
                : 'min-w-[72px]',
            slim && 'min-w-[32px]',
            disabled && 'opacity-50',
            className,
          )}
          size={size}
          variant={variant}
          onClick={async (e) => {
            // We have a detail popover rendering at times for the follow button
            // so we are not disabling the component at the root.
            if (disabled) {
              // If we are rendering the details popover don't navigate.
              if (!withDetailsPopover) {
                navigateToProfile({ user: user, includeReason });
              }

              return;
            }

            e.preventDefault();
            e.stopPropagation();

            trackEvent(
              user.viewerContext?.following
                ? AnalyticsEvent.AccountUnfollow
                : AnalyticsEvent.AccountFollow,
              {
                target: user.fid,
                ...(castHash ? { castHash } : {}),
                ...(!user.viewerContext?.following && includeReason
                  ? { includeReason, sourceSurface: 'home_feed' }
                  : {}),
              },
            );
            try {
              if (user.viewerContext?.following) {
                await deleteFollow({ followee: user, follower: currentUser });
              } else {
                await createFollow({ followee: user, follower: currentUser });
              }
            } catch (error) {
              // TODO: Add proper UI for error
              trackError(error);
              alert(error);
            }
          }}
        >
          {content}
        </DefaultButton>
      );
    }, [
      fullWidth,
      size,
      slim,
      disabled,
      className,
      variant,
      content,
      trackEvent,
      user,
      withDetailsPopover,
      includeReason,
      castHash,
      navigateToProfile,
      deleteFollow,
      currentUser,
      createFollow,
    ]);

    if (currentUser.fid === user.fid) {
      return null;
    }

    if (disabled && withDetailsPopover) {
      return (
        <FollowsDisabledDetails>{followButtonContent}</FollowsDisabledDetails>
      );
    }

    return <>{followButtonContent}</>;
  },
);

AuthenticatedFollowButtonContent.displayName =
  'AuthenticatedFollowButtonContent';

export { FollowButton };
