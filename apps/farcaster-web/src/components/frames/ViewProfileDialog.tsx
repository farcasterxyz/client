import {
  formatShorthandNumber,
  resolveUsernameShort,
  useFollowersYouKnow,
  useUser,
} from 'farcaster-client-hooks';
import React, { Suspense } from 'react';

import { AvatarImage } from '~/components/avatar/AvatarImage';
import { FollowButton } from '~/components/forms/buttons/FollowButton';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { FollowersYouKnowContent } from '~/components/profiles/headerSections/FollowersYouKnow';

interface ViewProfileDialogProps {
  fid: number;
  onDismiss: () => void;
}

export const ViewProfileDialog: React.FC<ViewProfileDialogProps> = ({
  fid,
  onDismiss,
}) => {
  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 top-[60px] animate-overlay-show bg-black/30 dark:bg-white/30"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      />
      <Suspense fallback={<div />}>
        <div
          className="absolute inset-x-4 bottom-4 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <ViewProfileDialogInner fid={fid} />
        </div>
      </Suspense>
    </>
  );
};

function ViewProfileDialogInner({ fid }: { fid: number }) {
  const { data: userData } = useUser({ fid });
  const { data: followData } = useFollowersYouKnow({ fid, limit: 3 });

  const user = userData.result.user;
  const users = React.useMemo(() => {
    return followData!.pages.flatMap((page) => page.result.users);
  }, [followData]);

  const totalCount = React.useMemo(() => {
    return followData!.pages[0].result.totalCount;
  }, [followData]);

  return (
    <div className="mx-auto w-full max-w-[424px] animate-frame-action-content-show space-y-3 rounded-xl px-4 py-8 bg-app border-default">
      <div className="flex flex-col items-center space-y-[10px]">
        <LinkToProfile
          title={`${user.displayName}'s profile`}
          user={user}
          newTab={true}
        >
          <AvatarImage
            imgUrl={user.pfp?.url}
            imgAlt={user.displayName}
            size="xl"
          />
        </LinkToProfile>

        <div className="flex flex-col items-center space-y-2">
          <LinkToProfile
            title={`${user.displayName}'s profile`}
            user={user}
            newTab={true}
            className="text-2xl font-semibold text-inherit"
          >
            {resolveUsernameShort(user)}
          </LinkToProfile>
          <div className="flex space-x-[10px]">
            {user.followerCount !== undefined && (
              <div>
                <span className="text-sm font-semibold text-muted">
                  {formatShorthandNumber(user.followerCount)}
                </span>{' '}
                <span className="text-sm text-muted">
                  follower{user.followerCount !== 1 && 's'}
                </span>
              </div>
            )}
            {user.followingCount !== undefined && (
              <div>
                <span className="text-sm font-semibold text-muted">
                  {formatShorthandNumber(user.followingCount)}
                </span>{' '}
                <span className="text-sm text-muted">following</span>
              </div>
            )}
          </div>
          <div className="text-center text-muted">
            {user.profile.bio.text.replace(/\n/g, ' ')}
          </div>
          <div>
            <FollowersYouKnowContent
              users={users}
              totalCount={totalCount}
              variant="condensed"
            />
          </div>
        </div>
        <div className="w-full pt-3">
          <FollowButton user={user} fullWidth className="h-[48px]" />
        </div>
      </div>
    </div>
  );
}
