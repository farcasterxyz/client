import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNewCastNotificationGroup } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
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

type NewCastNotificationGroupProps = {
  group: ApiNewCastNotificationGroup;
};

const NewCastNotificationGroup: FC<NewCastNotificationGroupProps> = memo(
  ({ group }) => {
    const push = usePush();
    const pushToUserProfile = usePushToUserProfile();
    const { trackEvent } = useTrackEvent();
    const t = useTheme();

    const firstCast = React.useMemo(() => {
      return group.previewItems[0].content.cast;
    }, [group.previewItems]);

    const users = React.useMemo(
      () =>
        group.previewItems.flatMap((previewItem) => previewItem.actor) || [],
      [group.previewItems],
    );

    const totalCount = React.useMemo(() => {
      return Array.from(
        new Set(group.previewItems.map(({ actor }) => actor.fid)),
      ).length;
    }, [group.previewItems]);

    const title = React.useMemo(() => {
      if (totalCount === 1) {
        return (
          <NotificationTitleText
            style={[
              t.mY2,
              t.mR1,
              t.flex,
              t.flexRow,
              t.texts.primary,
              t.flexWrap,
              t.itemsCenter,
            ]}
          >
            New casts from{' '}
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
          </NotificationTitleText>
        );
      }

      return (
        <NotificationTitleText
          style={[t.mY2, t.mR1, t.flex, t.flexRow, t.flexWrap, t.itemsCenter]}
        >
          New casts from{' '}
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
          </NotificationTitleTextWithPress>{' '}
          and {totalCount === 2 ? '1 other' : `${totalCount - 1} others`}
        </NotificationTitleText>
      );
    }, [
      firstCast.author,
      group.type,
      pushToUserProfile,
      t.flex,
      t.flexRow,
      t.flexWrap,
      t.itemsCenter,
      t.mR1,
      t.mY2,
      t.texts.primary,
      totalCount,
      trackEvent,
    ]);

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
        <View style={[t.relative]}>
          <NotificationIcon variant="blue">
            {(iconColor) => (
              <Octicons
                name="bell-fill"
                size={24}
                style={[{ color: iconColor }]}
              />
            )}
          </NotificationIcon>
        </View>
        <NotificationGroupInnerContainer>
          <NotificationGroupAvatars actors={users} />
          <View style={[t.flexCol, t.flex]}>{title}</View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

NewCastNotificationGroup.displayName = 'NewCastNotificationGroup';

export { NewCastNotificationGroup };
