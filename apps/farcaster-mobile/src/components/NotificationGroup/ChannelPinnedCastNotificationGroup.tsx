import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannelPinnedCastNotificationGroup } from 'farcaster-client-data';
import {
  renderChannelKey,
  useGloballyCachedCast,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { ChevronRight } from 'lucide-react-native';
import React, { FC, memo } from 'react';
import { Pressable, View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { MegaphoneIcon } from '~/components/images/Megaphone';
import { Text } from '~/components/Text';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type ChannelPinnedCastNotificationGroupProps = {
  group: ApiChannelPinnedCastNotificationGroup;
};
const ChannelPinnedCastNotificationGroup: FC<ChannelPinnedCastNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const push = usePush();
    const { trackEvent } = useTrackEvent();

    const cast = useGloballyCachedCast({
      fallback: group.previewItems[0].content.cast,
    });

    const channel = cast.channel;
    if (!channel) {
      return null;
    }

    if (group.totalItemCount === 1) {
      return (
        <View>
          <Pressable
            style={[
              t.flexRow,
              t.itemsCenter,
              t.pX3,
              t.pT3,
              { marginBottom: -4 },
            ]}
            onPress={() => {
              trackEvent(AnalyticsEvent.ClickNotification, {
                type: group.type,
              });

              push('Cast', {
                castHash: cast.hash,
              });
            }}
          >
            <View
              style={[
                t.flexRow,
                t.justifyEnd,
                { width: defaultThumbnailDiameter },
              ]}
            >
              <MegaphoneIcon size={15} color={t.colors.text.brand} />
            </View>
            <View style={[t.pX2]}>
              <Text
                style={[t.fontSemibold, t.textXs, t.texts.brand]}
                numberOfLines={1}
              >
                Announcement
              </Text>
            </View>
          </Pressable>
          <Cast cast={cast} />
        </View>
      );
    }

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('NotificationsInGroup', {
            groupId: group.id,
            type: group.type,
            title: `Announcements in /${channel.key}`,
          });
        }}
      >
        <NotificationIcon variant="purple" channelImageUrl={channel.imageUrl}>
          {(iconColor) => <MegaphoneIcon size={16} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationTitleText>
            {group.totalItemCount} announcements in{' '}
            {renderChannelKey(channel.key)}
          </NotificationTitleText>
        </NotificationGroupInnerContainer>
        <View style={[t.selfCenter]}>
          <ChevronRight size={16} color={t.colors.text.primary} />
        </View>
      </NotificationGroupOuterContainer>
    );
  });
ChannelPinnedCastNotificationGroup.displayName = 'CastReplyNotificationGroup';

export { ChannelPinnedCastNotificationGroup };
