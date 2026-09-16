import classNames from 'classnames';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsername, useGloballyCachedUser } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { FollowButton } from '~/components/forms/buttons/FollowButton';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { FollowersYouKnowContent } from '~/components/profiles/headerSections/FollowersYouKnow';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';

type UserProps = {
  user: ApiUser;
  withDetailsPopover?: boolean;
  skipSeperator?: boolean;
  Badge?: React.ReactElement;
  Action?: React.ReactElement | null;
  ActionAlign?: 'center' | 'flex-start';
};

export const ListFollowButton = ({ user }: { user: ApiUser }) => {
  return (
    <FollowButton user={user} size="md" inverted unfollowText="Following" />
  );
};

export const BaseUserListItem: FC<UserProps> = memo(
  ({
    user: userProp,
    withDetailsPopover = true,
    skipSeperator = false,
    Badge,
    Action,
    ActionAlign,
  }) => {
    const user = useGloballyCachedUser({ fallback: userProp });

    const FollowersYouKnow = useMemo(() => {
      const followersYouKnow = user.viewerContext?.followersYouKnow;

      if (followersYouKnow) {
        return (
          <div className="pb-[2px] pt-2">
            <FollowersYouKnowContent
              {...followersYouKnow}
              variant="condensed"
            />
          </div>
        );
      }

      return null;
    }, [user.viewerContext?.followersYouKnow]);

    return (
      <>
        <div
          className={classNames(
            'relative flex flex-row justify-between px-3 py-2 border-default',
            !skipSeperator && 'border-b',
          )}
          style={{ alignItems: ActionAlign }}
        >
          <LinkToProfile
            title={user.displayName}
            user={user}
            className="absolute inset-0"
          />
          <div className="flex shrink flex-row gap-3">
            <Avatar
              user={user}
              className="mr-2"
              size="sm2"
              disabled={true}
              withDetailsPopover={withDetailsPopover}
            />
            <div className="min-w-0 shrink">
              <UserDisplayNameWithBadges
                user={user}
                style="base"
                Badge={Badge}
              />
              <div className="line-clamp-2 text-sm text-muted">
                {resolveUsername({
                  username: user.username,
                  fid: user.fid,
                })}
              </div>
              {FollowersYouKnow}
            </div>
          </div>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {Action !== undefined ? Action : <ListFollowButton user={user} />}
          </div>
          <DebugLogger name="User" data={{ user }} />
        </div>
      </>
    );
  },
);

BaseUserListItem.displayName = 'BaseUserListItem';
