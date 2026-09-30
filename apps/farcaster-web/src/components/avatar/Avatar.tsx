import { PlusIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import {
  useCreateFollow,
  useGloballyCachedUser,
  useTrackEvent,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import { FC, memo, MouseEvent, useMemo } from 'react';

import { AvatarImage, AvatarImageProps } from '~/components/avatar/AvatarImage';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { trackError } from '~/utils/errorUtils';

type AvatarProps = Pick<AvatarImageProps, 'className' | 'size'> & {
  user: ApiUser;
  onClick?: (e: MouseEvent) => void;
  withDetailsPopover?: boolean;
  disabled?: boolean;
  loading?: HTMLImageElement['loading'];
  priority?: boolean;
  hideFollowButton?: boolean;
  style?: React.CSSProperties;
  isHighlighted?: boolean;
  followCastChannel?: string;
  followCastHash?: string;
  followIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
};

const Avatar: FC<AvatarProps> = memo(
  ({
    user: fallbackUser,
    className,
    onClick,
    withDetailsPopover = false,
    size = 'md',
    disabled = false,
    loading,
    priority,
    hideFollowButton,
    style,
    isHighlighted = false,
    followCastChannel,
    followCastHash,
    followIncludeReason,
    profileOpenIncludeReason,
  }) => {
    const user = useGloballyCachedUser({ fallback: fallbackUser });
    const isSignedIn = useIsSignedIn();

    const content = useMemo(() => {
      if (
        isSignedIn &&
        !disabled &&
        (size === 'md' || size === 'sm') &&
        !hideFollowButton &&
        user.viewerContext?.following === false
      ) {
        return (
          <div className={cn(['relative', className])}>
            <AvatarImage
              size={size}
              imgUrl={user.pfp?.url}
              imgAlt={`${user.displayName} avatar`}
              loading={loading}
              priority={priority}
              style={style}
            />
            <AvatarFollowUser
              user={user}
              isHighlighted={isHighlighted}
              followCastChannel={followCastChannel}
              followCastHash={followCastHash}
              followIncludeReason={followIncludeReason}
            />
          </div>
        );
      } else {
        return (
          <AvatarImage
            className={className}
            size={size}
            imgUrl={user.pfp?.url}
            imgAlt={`${user.displayName} avatar`}
            loading={loading}
            priority={priority}
            style={style}
          />
        );
      }
    }, [
      className,
      disabled,
      hideFollowButton,
      isSignedIn,
      loading,
      priority,
      size,
      user,
      style,
      isHighlighted,
      followCastChannel,
      followCastHash,
      followIncludeReason,
    ]);

    if (withDetailsPopover) {
      return (
        <LinkToProfileWithSummaryTooltip
          title={user.displayName}
          user={user}
          includeReason={profileOpenIncludeReason}
          onClick={onClick}
        >
          {content}
        </LinkToProfileWithSummaryTooltip>
      );
    }

    if (disabled) {
      return content;
    }

    return (
      <LinkToProfile
        title={user.displayName}
        user={user}
        includeReason={profileOpenIncludeReason}
        className="relative inline-block h-min shrink-0"
        onClick={onClick}
      >
        {content}
      </LinkToProfile>
    );
  },
);

Avatar.displayName = 'Avatar';

const AvatarFollowUser: FC<{
  user: ApiUser;
  isHighlighted?: boolean;
  followCastChannel?: string;
  followCastHash?: string;
  followIncludeReason?: ApiCastFeedIncludeReason['type'];
}> = memo(
  ({
    user,
    isHighlighted,
    followCastChannel,
    followCastHash,
    followIncludeReason,
  }) => {
    const currentUser = useCurrentUser();

    const createFollow = useCreateFollow();
    const { trackEvent } = useTrackEvent();
    const { shouldLinkToUser } = useUserLinkHelpers();

    const linkToUser = useMemo(
      () => shouldLinkToUser({ fid: user.fid }),
      [shouldLinkToUser, user.fid],
    );

    if (!linkToUser || currentUser.fid === user.fid) {
      return null;
    }

    return (
      <>
        <div
          title={`Follow ${user.displayName}`}
          onClick={(e) => {
            try {
              trackEvent(AnalyticsEvent.AccountFollow, {
                target: user.fid,
                on: 'avatar',
                ...(followCastChannel
                  ? { castChannel: followCastChannel }
                  : {}),
                ...(followCastHash ? { castHash: followCastHash } : {}),
                ...(followIncludeReason
                  ? {
                      includeReason: followIncludeReason,
                      sourceSurface: 'home_feed',
                    }
                  : {}),
              });
              createFollow({ followee: user, follower: currentUser });
            } catch (error) {
              trackError(error);
              alert(error);
            }
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn(
            'absolute bottom-0 right-0 mb-[-4px] mr-[-4px] flex h-[20px] w-[20px] items-center justify-center rounded-full border-[2px] bg-[#E2D8F4] hover:bg-[#c1a9df]',
            isHighlighted
              ? 'border-[#F5F4FF] dark:border-[#1F182C]'
              : 'border-app',
          )}
        >
          <PlusIcon
            className="text-[#8A63D2]"
            size={12.5}
            verticalAlign="top"
          />
        </div>
      </>
    );
  },
);

AvatarFollowUser.displayName = 'AvatarFollowUser';

export { Avatar };
