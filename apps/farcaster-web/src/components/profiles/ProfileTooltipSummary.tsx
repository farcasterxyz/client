import cn from 'classnames';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsername, useGloballyCachedUser } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { FollowButton } from '~/components/forms/buttons/FollowButton';
import { LinkToFollowers } from '~/components/links/LinkToFollowers';
import { LinkToFollowing } from '~/components/links/LinkToFollowing';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { FollowCount } from '~/components/profiles/FollowCount';
import { FollowsYou } from '~/components/users/FollowsYou';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';

import { ProfileFollowersYouKnowSection } from './headerSections/ProfileFollowersYouKnowSection';

type ProfileTooltipSummaryProps = {
  user: ApiUser;
};

const ProfileTooltipSummary: FC<ProfileTooltipSummaryProps> = memo(
  ({ user: fallbackUser }) => {
    const user = useGloballyCachedUser({ fallback: fallbackUser });

    const { fid: currentUserFid } = useCurrentUser();

    const isProUser = useUserLevel(user) === 'pro';

    const mainContent = useMemo(() => {
      return (
        <div className="flex flex-col space-y-2">
          <div>
            <LinkToProfile
              title={user.displayName}
              user={user}
              className="relative truncate text-base font-semibold text-default hover:underline"
            >
              {user.displayName}
            </LinkToProfile>
            <div className="flex flex-row items-baseline space-x-2">
              <LinkToProfile
                title={user.displayName}
                user={user}
                className="relative text-muted hover:underline"
              >
                {resolveUsername({
                  username: user.username,
                  fid: user.fid,
                })}
              </LinkToProfile>
              {user.viewerContext?.followedBy && <FollowsYou />}
            </div>
          </div>
          {user.profile.bio && (
            <div
              className={cn(
                'max-h-[100px] overflow-hidden text-ellipsis text-sm break-gracefully text-faint',
              )}
            >
              {user.profile.bio.text}
            </div>
          )}
          <div className="mt-2 flex flex-row gap-2">
            <LinkToFollowing
              title={`Users followed by ${user.displayName}`}
              user={user}
              className="text-muted hover:underline"
            >
              <FollowCount count={user.followingCount} label="Following" />
            </LinkToFollowing>
            <LinkToFollowers
              title={`Users following ${user.displayName}`}
              user={user}
              className="text-muted hover:underline"
            >
              <FollowCount count={user.followerCount} label="Followers" />
            </LinkToFollowers>
          </div>
          {user.fid !== currentUserFid && user.followerCount !== 0 && (
            <div className="mt-4">
              <ProfileFollowersYouKnowSection user={user} lite={true} />
            </div>
          )}
        </div>
      );
    }, [currentUserFid, user]);

    return (
      <div className="min-h-0 w-[320px] grow overflow-hidden rounded-lg p-4 shadow-md bg-app">
        <div className="flex flex-col items-start justify-between">
          <div className="mb-2 flex w-full flex-row justify-between">
            <span className="relative">
              <Avatar user={user} size="lg" className="mr-2 md:mr-4" />
              {isProUser && (
                <div
                  className="absolute bottom-0 right-[8px] flex size-[24px] cursor-pointer items-center justify-center rounded-full text-inverted"
                  title={'Farcaster Pro'}
                >
                  <FarcasterProBadge size={24} showBorder />
                </div>
              )}
            </span>
            <FollowButton user={user} className="h-min shrink-0 grow-0" />
          </div>
          {mainContent}
        </div>
      </div>
    );
  },
);

ProfileTooltipSummary.displayName = 'ProfileTooltipSummary';

export { ProfileTooltipSummary };
