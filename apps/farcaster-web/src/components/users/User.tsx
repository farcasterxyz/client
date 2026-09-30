import cn from 'classnames';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsername, useGloballyCachedUser } from 'farcaster-client-hooks';
import { FC, memo, MouseEvent, useCallback, useMemo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { AvatarImageProps } from '~/components/avatar/AvatarImage';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { FollowButton } from '~/components/forms/buttons/FollowButton';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { Following } from '~/components/users/Following';
import { FollowingEachOther } from '~/components/users/FollowingEachOther';
import { FollowsYou } from '~/components/users/FollowsYou';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';
import { useUserLevel } from '~/hooks/data/useUserLevel';

type UserProps = {
  className?: string;
  compact?: boolean;
  hideFollowButton?: boolean;
  showFollowButtonOnlyIfUnfollowed?: boolean;
  showFollowing?: boolean;
  onClick?: (e: MouseEvent) => void;
  withDetailsPopover?: boolean;
  user: ApiUser;
  disableClickNavigations?: boolean;
  followStyle?: 'default' | 'inverted';
  avatarSizing?: AvatarImageProps['size'];
  sidePadding?: boolean;
  showBottomBorder?: boolean;
  Action?: React.ReactNode;
};

const User: FC<UserProps> = memo(
  ({
    className,
    compact,
    onClick,
    hideFollowButton = false,
    showFollowButtonOnlyIfUnfollowed = false,
    withDetailsPopover = false,
    showFollowing,
    avatarSizing,
    user: userProp,
    disableClickNavigations = false,
    followStyle = 'default',
    sidePadding = true,
    showBottomBorder = true,
    Action,
  }) => {
    const user = useGloballyCachedUser({ fallback: userProp });
    const isProUser = useUserLevel(user) === 'pro';

    const followPill = useMemo(() => {
      if (
        showFollowing &&
        user.viewerContext?.followedBy &&
        user.viewerContext?.following
      ) {
        return <FollowingEachOther />;
      } else if (showFollowing && user.viewerContext?.following) {
        return <Following />;
      } else if (showFollowing && user.viewerContext?.followedBy) {
        return <FollowsYou />;
      }
      return undefined;
    }, [showFollowing, user.viewerContext]);

    const innerOnClick = useCallback(
      (e: MouseEvent) => {
        if (onClick) {
          onClick(e);
        }
      },
      [onClick],
    );

    return (
      <div
        onClick={onClick}
        className={cn(
          'relative flex flex-row justify-between border-default',
          showBottomBorder && 'border-b',
          sidePadding ? (compact ? 'p-2' : 'p-4') : compact ? 'py-2' : 'py-4',
          compact ? 'items-center' : 'items-start',
          className,
        )}
      >
        <DebugLogger name="User" data={{ user }} />
        <div className="flex min-w-0 flex-row">
          {!disableClickNavigations && (
            <LinkToProfile
              title={user.displayName}
              user={user}
              className="absolute inset-0"
              onClick={innerOnClick}
            />
          )}
          <Avatar
            user={user}
            className="mr-2"
            onClick={onClick}
            withDetailsPopover={withDetailsPopover}
            size={avatarSizing}
            disabled={true}
          />
          <div className="min-w-0">
            <UserDisplayNameWithBadges
              user={user}
              style="base"
              Badge={
                isProUser && <FarcasterProBadge size={20} className="mb-1" />
              }
            />
            <div className="line-clamp-2 flex flex-row flex-wrap items-center gap-1">
              <div
                className={cn('text-muted', compact ? 'text-sm' : 'text-base')}
              >
                {resolveUsername({
                  username: user.username,
                  fid: user.fid,
                })}
              </div>
              {typeof followPill !== 'undefined' && (
                <div className="inline-block">{followPill}</div>
              )}
            </div>
            {!compact && (
              <div className="break-gracefully">
                <LinkifiedText
                  content={user.profile.bio.text}
                  mentions={user.profile.bio.mentions}
                  channelMentions={user.profile.bio.channelMentions}
                  tokenMentions={undefined}
                  tokenMentionsV2={undefined}
                />
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          {Action || (
            <>
              {!hideFollowButton &&
                !(
                  showFollowButtonOnlyIfUnfollowed &&
                  user.viewerContext?.following
                ) && (
                  <FollowButton
                    user={user}
                    className="ml-2"
                    size={compact ? 'sm-tall' : 'md'}
                    inverted={followStyle === 'inverted'}
                  />
                )}
            </>
          )}
        </div>
      </div>
    );
  },
);

User.displayName = 'User';

export { User };
