import { ApiTrendingFollowRecommendationNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type TrendingFollowRecommendationNotificationGroupProps = {
  group: ApiTrendingFollowRecommendationNotificationGroup;
};

const TrendingFollowRecommendationNotificationGroup: FC<TrendingFollowRecommendationNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();

    const notif = group.previewItems[0];

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          pushToUserProfile({ fid: notif.content.recommendedUser.fid });
        }}
      >
        <NotificationGraphic>
          <Avatar
            diameter={48}
            pfpUrl={notif.content.mutualFollowers[0].pfp?.url}
          />
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 2 }]}>
            <Text2 weight="semibold">
              @{notif.content.mutualFollowers[0].username} and{' '}
              {notif.content.mutualFollowers.length - 1} others
            </Text2>
            <Text2 color="secondary">
              followed @{notif.content.recommendedUser.username} on Farcaster
              today
            </Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

TrendingFollowRecommendationNotificationGroup.displayName =
  'TrendingFollowRecommendationNotificationGroup';

export { TrendingFollowRecommendationNotificationGroup };
