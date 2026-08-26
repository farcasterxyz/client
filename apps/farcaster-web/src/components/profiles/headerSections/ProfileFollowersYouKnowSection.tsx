import { ApiUser } from 'farcaster-client-data';
import { useFollowersYouKnow } from 'farcaster-client-hooks';
import React from 'react';

import { LinkToFollowersYouKnow } from '~/components/links/LinkToFollowersYouKnow';
import { FollowersYouKnowContent } from '~/components/profiles/headerSections/FollowersYouKnow';

type ProfileFollowersYouKnowSectionProps = {
  user: ApiUser;
  lite?: boolean;
};

const ProfileFollowersYouKnowSection: React.FC<
  ProfileFollowersYouKnowSectionProps
> = ({ user, lite = false }) => {
  return (
    <React.Suspense fallback={<div className="h-[36px]" />}>
      <ProfileFollowersYouKnow user={user} lite={lite} />
    </React.Suspense>
  );
};

ProfileFollowersYouKnowSection.displayName = 'ProfileFollowersYouKnowSection';

const ProfileFollowersYouKnow: React.FC<
  ProfileFollowersYouKnowSectionProps
> = ({ user, lite }) => {
  const { data } = useFollowersYouKnow({ fid: user.fid, limit: 3 });

  const users = React.useMemo(() => {
    return data!.pages.flatMap((page) => page.result.users);
  }, [data]);

  const totalCount = React.useMemo(() => {
    return data!.pages[0].result.totalCount;
  }, [data]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <LinkToFollowersYouKnow
      className="min-h-[36px] items-start text-muted hover:underline"
      title="Followers you know"
      user={user}
      source="profile"
    >
      <FollowersYouKnowContent
        users={users}
        totalCount={totalCount}
        variant={lite ? 'lite' : undefined}
      />
    </LinkToFollowersYouKnow>
  );
};

ProfileFollowersYouKnow.displayName = 'ProfileFollowersYouKnow';

export { ProfileFollowersYouKnowSection };
