import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNotificationCollectibleCastWatchAvailable } from 'farcaster-client-data';
import { formatTimeAgo, useTrackEvent } from 'farcaster-client-hooks';
import { Text2 } from 'farcaster-expo';
import React, { FC, memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';

import ActionCollectibleIcon from '~/assets/icons/action-bid.svg';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationIcon } from './shared/NotificationIcon';

type ListCollectibleCastWatchAvailableNotificationProps = {
  notif: ApiNotificationCollectibleCastWatchAvailable;
};

const ListCollectibleCastWatchAvailableNotification: FC<ListCollectibleCastWatchAvailableNotificationProps> =
  memo(({ notif }) => {
    const t = useTheme();
    const push = usePush();
    const { triggerImpactAsync } = useHaptics();
    const { trackEvent } = useTrackEvent();

    const handlePress = useCallback(() => {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: notif.type,
        action: 'cast',
      });
      push('CollectibleCast', {
        username: notif.content.cast.author.username ?? '',
        castHash: notif.content.cast.hash,
      });
    }, [
      notif.content.cast.author.username,
      notif.content.cast.hash,
      notif.type,
      push,
      trackEvent,
      triggerImpactAsync,
    ]);

    let creatorUsername = notif.content.cast.author.username;
    if (creatorUsername) {
      creatorUsername = creatorUsername.endsWith('s')
        ? `${creatorUsername}'`
        : `${creatorUsername}'s`;
    }
    const label = `${creatorUsername} cast is now up for auction`;

    return (
      <Pressable
        style={[t.pX3, t.pY2, t.flexRow, t.itemsStart, { gap: 8 }]}
        onPress={handlePress}
      >
        <NotificationIcon variant={'purple'}>
          {(iconColor) => (
            <ActionCollectibleIcon
              size={24}
              color={iconColor}
              fill={iconColor}
            />
          )}
        </NotificationIcon>
        <View style={[t.flex1]}>
          <View style={[t.flexRow, t.justifyBetween, t.itemsStart]}>
            <View style={[t.flex1, t.pR2]}>
              <Text2 style={[t.texts.primary, t.fontSemibold]}>{label}</Text2>
            </View>
            <Text2 color="tertiary">
              {formatTimeAgo(notif.timestamp, 'floor')}
            </Text2>
          </View>
          <NotificationGroupCastText cast={notif.content.cast} />
        </View>
      </Pressable>
    );
  });

ListCollectibleCastWatchAvailableNotification.displayName =
  'ListCollectibleCastWatchAvailableNotification';

export { ListCollectibleCastWatchAvailableNotification };
