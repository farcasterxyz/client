import { Ionicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChannelWarningNotificationGroup,
  ApiNotificationChannelWarning,
} from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { NotificationGroupCastText } from '~/components/NotificationGroup/shared/NotificationGroupCastText';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import {
  NotificationTitleText,
  NotificationTitleTextWithPress,
} from './shared/NotificationTitleText';

type ChannelWarningNotificationGroupProps = {
  group: ApiChannelWarningNotificationGroup;
};

const ChannelWarningNotificationGroup: FC<ChannelWarningNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const { trackEvent } = useTrackEvent();
    const firstPreviewItem = group
      .previewItems[0] as ApiNotificationChannelWarning;
    const channelKey = firstPreviewItem.content.cast.channel?.key;
    const t = useTheme();

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Cast', { castHash: firstPreviewItem.content.cast.hash });
        }}
      >
        <NotificationIcon variant="red">
          {(iconColor) => (
            <Ionicons
              name="alert"
              size={18}
              style={[{ color: iconColor, marginTop: 1, marginLeft: 2 }]}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.mR1, t.flex, t.flexRow, t.texts.primary, t.flexWrap]}>
            <NotificationTitleText>{`Your cast does not follow the norms for `}</NotificationTitleText>
            <NotificationTitleTextWithPress
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: group.type,
                  action: 'channel',
                });

                push('Channel', { channelKey: channelKey ?? '' });
              }}
            >
              {`/${channelKey}`}
            </NotificationTitleTextWithPress>
          </View>
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ChannelWarningNotificationGroup.displayName = 'ChannelWarningNotificationGroup';

export { ChannelWarningNotificationGroup };
