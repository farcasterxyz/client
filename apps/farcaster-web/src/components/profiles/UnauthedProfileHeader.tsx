import { LocationIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ApiUserProfile } from 'farcaster-client-data';
import {
  resolveUsername,
  useGloballyCachedUser,
  usePrefetchUserCastsAndReplies,
} from 'farcaster-client-hooks';
import { FC, memo, useEffect } from 'react';

import { LinkToFollowers } from '~/components/links/LinkToFollowers';
import { LinkToFollowing } from '~/components/links/LinkToFollowing';
import { LinkToLocationUsers } from '~/components/links/LinkToLocationUsers';
import { FollowCount } from '~/components/profiles/FollowCount';
import { LinkifiedText } from '~/components/text/LinkifiedText';
import { FollowsYou } from '~/components/users/FollowsYou';
import { UserDisplayNameWithBadges } from '~/components/users/UserDisplayNameWithBadges';

type ProfileHeaderProps = {
  userProfile: ApiUserProfile;
  alternateLayout?: boolean;
};

const UnauthedProfileHeader: FC<ProfileHeaderProps> = memo(
  ({ userProfile, alternateLayout }) => {
    const { user: fallbackUser } = userProfile;
    const user = useGloballyCachedUser({ fallback: fallbackUser });
    const location = user.profile?.location;

    const prefetchUserCastsAndReplies = usePrefetchUserCastsAndReplies();

    useEffect(() => {
      prefetchUserCastsAndReplies({ fid: user.fid });
    }, [prefetchUserCastsAndReplies, user.fid]);

    return (
      <div className="flex flex-row items-start p-4 pt-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <UserDisplayNameWithBadges user={user} style="header" />
          <div className="flex flex-row items-baseline">
            <div className="mr-1 text-base text-muted">
              {resolveUsername({
                username: user.username,
                fid: user.fid,
              })}
            </div>
            {user.viewerContext?.followedBy && <FollowsYou />}
          </div>
          {user.profile.bio && (
            <div
              className={cn(
                'max-w-[480px] break-gracefully',
                alternateLayout ? 'mt-2' : 'mt-1',
              )}
            >
              <LinkifiedText
                content={user.profile.bio.text}
                mentions={user.profile.bio.mentions}
                channelMentions={user.profile.bio.channelMentions}
                tokenMentions={undefined}
                tokenMentionsV2={undefined}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center">
            {!!location?.placeId && (
              <div className="mt-2">
                <LinkToLocationUsers
                  title={`Users near ${location.description}`}
                  params={{ placeId: location.placeId }}
                  className="-mt-0.5 flex w-full flex-row items-center justify-start align-middle text-faint hover:underline"
                >
                  <LocationIcon size={16} className="text-faint" />
                  <span className="ml-1 line-clamp-1 max-w-[300px] pt-0.5 text-faint">
                    {location.description}
                  </span>
                </LinkToLocationUsers>{' '}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-row gap-2">
            <LinkToFollowing
              title={`Users followed by ${user.displayName}`}
              user={user}
            >
              <FollowCount count={user.followingCount} label="Following" />
            </LinkToFollowing>
            <LinkToFollowers
              title={`Users following ${user.displayName}`}
              user={user}
            >
              <FollowCount count={user.followerCount} label="Followers" />
            </LinkToFollowers>
          </div>
        </div>
      </div>
    );
  },
);

UnauthedProfileHeader.displayName = 'UnauthedProfileHeader';

export { UnauthedProfileHeader };
