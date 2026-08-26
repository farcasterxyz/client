import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiMiniAppNotificationGroup,
  ApiNotificationMiniApp,
} from 'farcaster-client-data';
import { formatTimeAgo, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { FrameIconImage } from '~/components/FrameIconImage';
import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationTitleText } from './shared/NotificationTitleText';

type MiniAppNotificationGroupProps = {
  group: ApiMiniAppNotificationGroup;
};

const MiniAppNotificationGroup: FC<MiniAppNotificationGroupProps> = memo(
  ({ group }) => {
    if (group.previewItems.length === 1) {
      return (
        <SingleMiniAppNotification
          group={group}
          notif={group.previewItems[0]}
        />
      );
    } else {
      return <MultipleMiniAppNotifications group={group} />;
    }
  },
);
MiniAppNotificationGroup.displayName = 'MiniAppNotificationGroup';

interface SingleMiniAppNotificationProps {
  group: ApiMiniAppNotificationGroup;
  notif: ApiNotificationMiniApp;
}

const SingleMiniAppNotification: FC<SingleMiniAppNotificationProps> = ({
  notif,
  group,
}) => {
  const t = useTheme();
  const launchFrame = useLaunchFrame();

  return (
    <NotificationGroupOuterContainer
      group={group}
      trackingProps={{
        domain: notif.content.miniapp.domain,
        name: notif.content.miniapp.name,
      }}
      onPress={() => {
        launchFrame({
          context: {
            type: 'notification',
            notification: {
              notificationId: notif.content.notificationId,
              title: notif.content.title,
              body: notif.content.body,
            },
          },
          config: {
            name: notif.content.miniapp.name,
            url: notif.content.targetUrl,
            splashImageUrl: notif.content.miniapp.splashImageUrl,
            splashBackgroundColor: notif.content.miniapp.splashBackgroundColor,
          },
          author: notif.content.miniapp.author,
          harmful: notif.content.miniapp.harmful,
        });
      }}
    >
      <NotificationGraphic>
        <FrameIconImage imageUrl={notif.content.miniapp.iconUrl} size={48} />
      </NotificationGraphic>
      <NotificationGroupInnerContainer>
        <View style={[t.flexCol, { gap: 2 }, t.mR6]}>
          <View style={[t.flexRow, t.itemsCenter, t.wFull]}>
            <View style={[t.flex1]}>
              <NotificationTitleText>
                {notif.content.title}
              </NotificationTitleText>
            </View>
            <Text2 color="tertiary">
              {formatTimeAgo(notif.timestamp, 'floor')}
            </Text2>
          </View>
          <NotificationDescriptionText
            color="primary"
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {notif.content.body}
          </NotificationDescriptionText>
        </View>
      </NotificationGroupInnerContainer>
    </NotificationGroupOuterContainer>
  );
};
SingleMiniAppNotification.displayName = 'SingleMiniAppNotification';

const MultipleMiniAppNotifications: FC<MiniAppNotificationGroupProps> = ({
  group,
}) => {
  const t = useTheme();
  const push = usePush();

  const firstNotif = useMemo(() => group.previewItems[0], [group.previewItems]);

  return (
    <NotificationGroupOuterContainer
      group={group}
      trackingProps={{
        domain: firstNotif.content.miniapp.domain,
        name: firstNotif.content.miniapp.name,
      }}
      trackAsGroup={true}
      onPress={() => {
        push('NotificationsInGroup', {
          groupId: group.id,
          type: group.type,
          title: firstNotif.content.miniapp.name,
        });
      }}
    >
      <NotificationGraphic centerVertically>
        <FrameIconImage
          imageUrl={firstNotif.content.miniapp.iconUrl}
          size={48}
        />
      </NotificationGraphic>
      <NotificationGroupInnerContainer>
        <View style={[t.flexCol, { gap: 2 }, t.mR6]}>
          <View style={[t.flexRow, t.itemsCenter, t.wFull, { columnGap: 4 }]}>
            <NotificationTitleText numberOfLines={2} ellipsizeMode="tail">
              <NotificationTitleText>
                {firstNotif.content.title}
              </NotificationTitleText>
              <NotificationTitleText>
                {' '}
                and {group.totalItemCount - 1} more from{' '}
              </NotificationTitleText>
              <NotificationTitleText>
                {firstNotif.content.miniapp.name}
              </NotificationTitleText>
            </NotificationTitleText>
          </View>
          <NotificationDescriptionText
            color="primary"
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {firstNotif.content.body}
          </NotificationDescriptionText>
        </View>
      </NotificationGroupInnerContainer>
    </NotificationGroupOuterContainer>
  );
};
MultipleMiniAppNotifications.displayName = 'MultipleMiniAppNotifications';

const ListMiniAppNotification: FC<{
  notif: ApiNotificationMiniApp;
}> = ({ notif }) => {
  const t = useTheme();
  const launchFrame = useLaunchFrame();
  const { trackEvent } = useTrackEvent();

  return (
    <Pressable
      style={[
        t.pX3,
        t.pY3,
        t.borderBHairline,
        t.borderDefault,
        t.flexRow,
        t.itemsStart,
      ]}
      onPress={() => {
        trackEvent(AnalyticsEvent.ClickNotification, {
          type: notif.type,
          domain: notif.content.miniapp.domain,
          name: notif.content.miniapp.name,
        });

        launchFrame({
          context: {
            type: 'notification',
            notification: {
              notificationId: notif.content.notificationId,
              title: notif.content.title,
              body: notif.content.body,
            },
          },
          config: {
            name: notif.content.miniapp.name,
            url: notif.content.targetUrl,
            splashImageUrl: notif.content.miniapp.splashImageUrl,
            splashBackgroundColor: notif.content.miniapp.splashBackgroundColor,
          },
          author: notif.content.miniapp.author,
          harmful: notif.content.miniapp.harmful,
        });
      }}
    >
      <FrameIconImage imageUrl={notif.content.miniapp.iconUrl} size={48} />
      <View style={[t.flexCol, t.mL3, t.flex1, { gap: 2 }]}>
        <View style={[t.flexRow, t.justifyBetween, t.itemsStart, t.wFull]}>
          <Text2 weight="semibold">{notif.content.title}</Text2>
          <Text2 color="tertiary">
            {formatTimeAgo(notif.timestamp, 'floor')}
          </Text2>
        </View>
        <Text2 color="secondary">{notif.content.body}</Text2>
      </View>
    </Pressable>
  );
};
SingleMiniAppNotification.displayName = 'SingleMiniAppNotification';

export { ListMiniAppNotification, MiniAppNotificationGroup };
