import { ApiAudioRoomScheduledStartNotificationGroup } from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text2 } from '~/components/Text';
import { useNavigationMethods } from '~/contexts/NavigationMethodsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationGraphic } from './shared/NotificationGraphic';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type AudioRoomScheduledStartNotificationGroupProps = {
  group: ApiAudioRoomScheduledStartNotificationGroup;
};

const AudioRoomScheduledStartNotificationGroup: FC<AudioRoomScheduledStartNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { navigate } = useNavigationMethods();
    const notification = group.previewItems[0];
    const { actor, content } = notification;

    const onPress = useCallback(() => {
      navigate('SpaceRoom', {
        roomId: content.roomId,
        autoStartScheduled: true,
      });
    }, [content.roomId, navigate]);

    const title = 'Your Space is scheduled to start';
    const body = 'Tap to start and join your Space.';

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationGraphic>
          <Avatar pfpUrl={actor.pfp?.url} diameter={48} />
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 2 }]}>
            <View style={[t.flexRow, t.justifyBetween, t.itemsStart, t.wFull]}>
              <Text2 weight="semibold" numberOfLines={2}>
                {title}
              </Text2>
              <Text2 color="tertiary">
                {formatTimeAgo(notification.timestamp, 'floor')}
              </Text2>
            </View>
            <Text2 color="secondary" numberOfLines={2}>
              {body}
            </Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

AudioRoomScheduledStartNotificationGroup.displayName =
  'AudioRoomScheduledStartNotificationGroup';

export { AudioRoomScheduledStartNotificationGroup };
