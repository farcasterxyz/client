import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNewCastInChannelNotificationGroup } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigateToFeed } from '~/hooks/navigation/useNavigateToFeed';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

import { NotificationGroupAvatars } from './shared/NotificationGroupAvatars';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import {
  NotificationTitleText,
  NotificationTitleTextWithPress,
} from './shared/NotificationTitleText';

type NewCastInChannelNotificationGroupProps = {
  group: ApiNewCastInChannelNotificationGroup;
};

const NewCastInChannelNotificationGroup: FC<NewCastInChannelNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const pushToUserProfile = usePushToUserProfile();
    const { trackEvent } = useTrackEvent();
    const t = useTheme();
    const navigateToFeed = useNavigateToFeed();

    const firstCast = React.useMemo(() => {
      return group.previewItems[0].content.cast;
    }, [group.previewItems]);

    const users = React.useMemo(
      () =>
        group.previewItems.flatMap((previewItem) => previewItem.actor) || [],
      [group.previewItems],
    );

    const isProUser = useUserLevel(firstCast.author) === 'pro';

    const totalCount = React.useMemo(() => {
      return Array.from(
        new Set(group.previewItems.map(({ actor }) => actor.fid)),
      ).length;
    }, [group.previewItems]);

    const channel = firstCast?.channel;
    const title = React.useMemo(() => {
      if (totalCount === 1) {
        return (
          <View
            style={[t.mY2, t.mR1, t.flex, t.flexRow, t.flexWrap, t.itemsCenter]}
          >
            <TextWithPress
              style={[t.texts.primary, t.fontBold, t.flex, t.hAuto]}
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: group.type,
                  action: 'author',
                });

                pushToUserProfile({ fid: firstCast.author.fid });
              }}
            >
              {resolveUsernameShort(firstCast.author)}
            </TextWithPress>
            {isProUser && <FarcasterProBadge size={14} style={[t.mL1]} />}
            <Text style={[t.texts.primary]}> casted in </Text>
            <TouchableOpacity
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: group.type,
                  action: 'channel',
                });

                navigateToFeed(channel?.key ?? '');
              }}
              activeOpacity={0.75}
            >
              <Text style={[t.texts.primary, t.fontBold]}>/{channel?.key}</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (!channel) {
        return null;
      }

      return (
        <View
          style={[t.mY2, t.mR1, t.flex, t.flexRow, t.flexWrap, t.itemsCenter]}
        >
          <NotificationTitleTextWithPress
            onPress={() => {
              trackEvent(AnalyticsEvent.ClickNotification, {
                type: group.type,
                action: 'author',
              });

              pushToUserProfile({ fid: firstCast.author.fid });
            }}
          >
            {resolveUsernameShort(firstCast.author)}
          </NotificationTitleTextWithPress>
          <NotificationTitleText>
            {' '}
            and {totalCount === 2 ? '1 other' : `${totalCount - 1} others`}{' '}
            casted in{' '}
          </NotificationTitleText>
          <TouchableOpacity
            onPress={() => {
              trackEvent(AnalyticsEvent.ClickNotification, {
                type: group.type,
                action: 'channel',
              });

              navigateToFeed(channel.key);
            }}
            activeOpacity={0.75}
          >
            <NotificationTitleText style={[t.texts.primary, t.fontBold]}>
              /{channel.key}
            </NotificationTitleText>
          </TouchableOpacity>
        </View>
      );
    }, [
      channel,
      firstCast.author,
      group.type,
      isProUser,
      navigateToFeed,
      pushToUserProfile,
      t.flex,
      t.flexRow,
      t.flexWrap,
      t.fontBold,
      t.hAuto,
      t.itemsCenter,
      t.mL1,
      t.mR1,
      t.mY2,
      t.texts.primary,
      totalCount,
      trackEvent,
    ]);

    if (typeof channel === 'undefined') {
      return null;
    }

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('NotificationsInGroup', {
            groupId: group.id,
            type: group.type,
            title: undefined,
          });
        }}
      >
        <NotificationIcon variant="blue" channelImageUrl={channel.imageUrl}>
          {(iconColor) => (
            <Octicons
              name="bell-fill"
              size={16}
              style={[{ color: iconColor }]}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupAvatars actors={users} />
          <View style={[t.flexCol, t.flex]}>{title}</View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

NewCastInChannelNotificationGroup.displayName =
  'NewCastInChannelNotificationGroup';

export { NewCastInChannelNotificationGroup };
