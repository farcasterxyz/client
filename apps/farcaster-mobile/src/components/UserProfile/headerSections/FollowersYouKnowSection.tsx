import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import { useFollowersYouKnow } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { FollowersYouKnowContent } from '~/components/headers/FollowersYouKnowContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

type FollowersYouKnowSectionProps = {
  user: ApiUser;
};

const FollowersYouKnowSection: React.FC<FollowersYouKnowSectionProps> = ({
  user,
}) => {
  return (
    <React.Suspense fallback={<View style={{ height: 60 }} />}>
      <FollowersYouKnow user={user} />
    </React.Suspense>
  );
};

FollowersYouKnowSection.displayName = 'FollowersYouKnowSection';

const FollowersYouKnow: React.FC<FollowersYouKnowSectionProps> = ({ user }) => {
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
    />
  );
};

export { FollowersYouKnowSection };
