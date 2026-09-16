import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { useFollowersYouKnow } from 'farcaster-client-hooks';
import React from 'react';

import { FollowersYouKnowContent } from '~/components/headers/FollowersYouKnowContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

type UpdatedFollowersYouKnowSectionProps = {
  user: ApiUser;
};

const UpdatedFollowersYouKnowSection: React.FC<
  UpdatedFollowersYouKnowSectionProps
> = ({ user }) => {
  return (
    <React.Suspense>
      <FollowersYouKnow user={user} />
    </React.Suspense>
  );
};

UpdatedFollowersYouKnowSection.displayName = 'UpdatedFollowersYouKnowSection';

const FollowersYouKnow: React.FC<UpdatedFollowersYouKnowSectionProps> = ({
  user,
}) => {
  const { trackEvent } = useAnalytics();
  const push = usePush();

  const { data } = useFollowersYouKnow({ fid: user.fid, limit: 3 });

  const users = React.useMemo(() => {
    return data!.pages.flatMap((page) => page.result.users);
  }, [data]);

  const totalCount = React.useMemo(() => {
    return data!.pages[0].result.totalCount;
  }, [data]);

  const onFollowersYouKnowPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickFollowersYouKnow, undefined);

    push('Follows', {
      fid: user.fid,
      displayName: user.displayName,
      initialTab: 'followersYouKnow',
    });
  }, [push, trackEvent, user.displayName, user.fid]);

  return (
    <FollowersYouKnowContent
      users={users}
      totalCount={totalCount}
      onPress={onFollowersYouKnowPress}
      condensed={true}
      size="profile"
    />
  );
};

export { UpdatedFollowersYouKnowSection };
