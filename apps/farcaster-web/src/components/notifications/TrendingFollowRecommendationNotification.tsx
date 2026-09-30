import { ApiTrendingFollowRecommendationNotificationGroup } from 'farcaster-client-data';
import { FC, memo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';

import { NotificationGraphic } from './shared/NotificationGraphic';

type TrendingFollowRecommendationNotificationGroupProps = {
  group: ApiTrendingFollowRecommendationNotificationGroup;
};

const TrendingFollowRecommendationNotificationGroup: FC<TrendingFollowRecommendationNotificationGroupProps> =
  memo(({ group }) => {
    const navigateToProfile = useNavigateToProfile();
    const notif = group.previewItems[0];

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={() => {
          navigateToProfile({ user: notif.content.recommendedUser });
        }}
      >
        <div className="flex items-center">
          <NotificationGraphic>
            <Avatar user={notif.content.mutualFollowers[0]} hideFollowButton />
          </NotificationGraphic>

          <div className="w-full min-w-0 grow">
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="text-base font-semibold text-default">
                {`@${notif.content.mutualFollowers[0].username} and ${notif.content.mutualFollowers.length - 1} others`}
              </div>
              <div className="text-muted">
                {`followed @${notif.content.recommendedUser.username} on Farcaster today`}
              </div>
            </div>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

TrendingFollowRecommendationNotificationGroup.displayName =
  'TrendingFollowRecommendationNotificationGroup';

export { TrendingFollowRecommendationNotificationGroup };
