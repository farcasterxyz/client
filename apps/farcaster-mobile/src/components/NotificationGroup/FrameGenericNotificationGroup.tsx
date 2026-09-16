import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiFrameGenericNotificationGroup,
  ApiNotificationFrameGeneric,
} from 'farcaster-client-data';
import { formatTimeAgo, useTrackEvent } from 'farcaster-client-hooks';
import { ChevronRight } from 'lucide-react-native';
import React, { FC, memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { FrameIconImage } from '~/components/FrameIconImage';
import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useLaunchFrame } from '~/hooks/useLaunchFrame';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type FrameGenericNotificationGroupProps = {
  group: ApiFrameGenericNotificationGroup;
};

const FrameGenericNotificationGroup: FC<FrameGenericNotificationGroupProps> =
  memo(({ group }) => {
    if (group.previewItems.length === 1) {
      return (
        <SingleFrameGenericNotification
          group={group}
          notif={group.previewItems[0]}
        />
      );
    } else {
      return <MultipleFrameGenericNotifications group={group} />;
    }
  });
FrameGenericNotificationGroup.displayName = 'FrameGenericNotificationGroup';

interface SingleFrameGenericNotificationProps {
  group: ApiFrameGenericNotificationGroup;
  notif: ApiNotificationFrameGeneric;
}

const SingleFrameGenericNotification: FC<
  SingleFrameGenericNotificationProps
> = ({ notif, group }) => {
  const t = useTheme();
  const launchFrame = useLaunchFrame();

  return (
    <NotificationGroupOuterContainer
      group={group}
      trackingProps={{
        domain: notif.content.frame.domain,
        name: notif.content.frame.name,
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
            name: notif.content.frame.name,
            url: notif.content.targetUrl,
            splashImageUrl: notif.content.frame.splashImageUrl,
            splashBackgroundColor: notif.content.frame.splashBackgroundColor,
          },
          author: notif.content.frame.author,
          harmful: notif.content.frame.harmful,
        });
      }}
    >
      <NotificationGraphic>
        <FrameIconImage imageUrl={notif.content.frame.iconUrl} size={48} />
      </NotificationGraphic>
      <NotificationGroupInnerContainer>
        <View style={[t.flexCol, { gap: 2 }, t.mR6]}>
          <View style={[t.flexRow, t.itemsCenter, t.wFull, { columnGap: 4 }]}>
            <View style={[t.flex1]}>
              <Text2 numberOfLines={1} ellipsizeMode="tail" weight="semibold">
                {notif.content.title}
              </Text2>
            </View>
            <Text2 color="tertiary">
              {formatTimeAgo(notif.timestamp, 'floor')}
            </Text2>
          </View>
          <Text2 color="secondary" numberOfLines={4} ellipsizeMode="tail">
            {notif.content.body}
          </Text2>
        </View>
      </NotificationGroupInnerContainer>
    </NotificationGroupOuterContainer>
  );
};
SingleFrameGenericNotification.displayName = 'SingleFrameGenericNotification';

const MultipleFrameGenericNotifications: FC<
  FrameGenericNotificationGroupProps
> = ({ group }) => {
  const t = useTheme();
  const push = usePush();

  const firstNotif = useMemo(() => group.previewItems[0], [group.previewItems]);

  return (
    <NotificationGroupOuterContainer
      group={group}
      trackingProps={{
        domain: firstNotif.content.frame.domain,
        name: firstNotif.content.frame.name,
      }}
      trackAsGroup={true}
      onPress={() => {
        push('NotificationsInGroup', {
          groupId: group.id,
          type: group.type,
          title: firstNotif.content.frame.name,
        });
      }}
    >
      <NotificationGraphic centerVertically>
        <FrameIconImage imageUrl={firstNotif.content.frame.iconUrl} size={48} />
      </NotificationGraphic>
      <NotificationGroupInnerContainer>
        <Text2>
          {group.totalItemCount} updates from{' '}
          <Text2 weight="semibold">{firstNotif.content.frame.name}</Text2>
        </Text2>
      </NotificationGroupInnerContainer>
      <View style={[t.selfCenter]}>
        <ChevronRight size={16} color={t.colors.text.primary} />
      </View>
    </NotificationGroupOuterContainer>
  );
};
MultipleFrameGenericNotifications.displayName =
  'MultipleFrameGenericNotifications';

const ListFrameGenericNotification: FC<{
  notif: ApiNotificationFrameGeneric;
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
          domain: notif.content.frame.domain,
          name: notif.content.frame.name,
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
            name: notif.content.frame.name,
            url: notif.content.targetUrl,
            splashImageUrl: notif.content.frame.splashImageUrl,
            splashBackgroundColor: notif.content.frame.splashBackgroundColor,
          },
          author: notif.content.frame.author,
          harmful: notif.content.frame.harmful,
        });
      }}
    >
      <FrameIconImage imageUrl={notif.content.frame.iconUrl} size={48} />
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
SingleFrameGenericNotification.displayName = 'SingleFrameGenericNotification';

export { FrameGenericNotificationGroup, ListFrameGenericNotification };
