import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNotificationType, ApiUser } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

import { NotificationGroupAvatars } from './NotificationGroupAvatars';
import {
  NotificationTitleText,
  NotificationTitleTextWithPress,
} from './NotificationTitleText';

type NotificationGroupHeadingProps = {
  actors: ApiUser[];
  groupId: string;
  predicate: React.ReactNode;
  totalItemCount: number;
  includeAvatars?: boolean;
} & (
  | {
      type: Exclude<ApiNotificationType, 'nearby' | 'asset-event'>;
      locationDescription?: undefined;
    }
  | {
      type: Extract<ApiNotificationType, 'nearby'>;
      locationDescription: string;
    }
);

const NotificationGroupHeading: FC<NotificationGroupHeadingProps> = memo(
  (props) => {
    const {
      actors,
      groupId,
      predicate,
      totalItemCount,
      includeAvatars = true,
      type,
      locationDescription,
    } = props;
    const { trackEvent } = useTrackEvent();
    const t = useTheme();
    const push = usePush();
    const pushToUserProfile = usePushToUserProfile();

    const firstActor = actors[0];
    const secondActor = actors[1];

    const othersText = useMemo(() => {
      const numOtherActors = totalItemCount - 1;

      if (numOtherActors === 0) {
        return ' ';
      }

      if (numOtherActors === 1) {
        return (
          <>
            <NotificationTitleText> and </NotificationTitleText>
            <NotificationTitleTextWithPress
              onPress={() => {
                if (secondActor) {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type: groupId,
                    action: 'actor',
                  });

                  pushToUserProfile({ fid: secondActor.fid });
                }
              }}
            >
              1 other{' '}
            </NotificationTitleTextWithPress>
          </>
        );
      }

      return (
        <>
          <NotificationTitleText> and </NotificationTitleText>
          <NotificationTitleTextWithPress
            onPress={() => {
              trackEvent(AnalyticsEvent.ClickNotification, {
                type: groupId,
                action: 'actors',
              });

              switch (type) {
                case 'nearby':
                  push('NotificationActorsInGroup', {
                    groupId,
                    type,
                    locationDescription,
                  });
                  return;
                default:
                  push('NotificationActorsInGroup', { groupId, type });
                  return;
              }
            }}
          >
            {`${numOtherActors} others `}
          </NotificationTitleTextWithPress>
        </>
      );
    }, [
      groupId,
      locationDescription,
      push,
      pushToUserProfile,
      secondActor,
      totalItemCount,
      trackEvent,
      type,
    ]);

    const isProUser = useUserLevel(firstActor) === 'pro';

    return (
      <>
        {includeAvatars && <NotificationGroupAvatars actors={actors} />}
        <View
          style={[
            includeAvatars ? t.mT2 : undefined,
            t.mR1,
            t.flex,
            t.flexRow,
            t.flexWrap,
            t.texts.primary,
            t.itemsCenter,
            t.overflowHidden,
          ]}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 2 }]}>
            <NotificationTitleTextWithPress
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: groupId,
                  action: 'actor',
                });

                pushToUserProfile({ fid: firstActor.fid });
              }}
            >
              {type !== 'invite-leaderboard-rank'
                ? resolveUsernameShort({
                    username: firstActor.username,
                    fid: firstActor.fid,
                  })
                : null}
            </NotificationTitleTextWithPress>
            {isProUser && <FarcasterProBadge size={14} />}
          </View>
          <NotificationTitleText>{othersText}</NotificationTitleText>
          <NotificationTitleText>{predicate}</NotificationTitleText>
        </View>
      </>
    );
  },
);

NotificationGroupHeading.displayName = 'NotificationGroupHeading';

export { NotificationGroupHeading };
