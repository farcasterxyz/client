import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDormantUserNewCastNotificationGroup } from 'farcaster-client-data';
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

type DormantUserNewCastNotificationGroupProps = {
  group: ApiDormantUserNewCastNotificationGroup;
};

const DormantUserNewCastNotificationGroup: FC<DormantUserNewCastNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const { trackEvent } = useTrackEvent();
    const t = useTheme();
    const pushToUserProfile = usePushToUserProfile();

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
            style={[t.mY2, t.mR1, t.flex, t.flexRow, t.flexWrap, t.itemsCenter]}
          >
            <NotificationTitleTextWithPress
              style={t.flex}
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
            casted for the first time in a while
          </NotificationTitleText>
        );
      }

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
          <NotificationTitleTextWithPress
            style={[t.texts.primary, t.fontBold, t.flex]}
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
          and {totalCount === 2 ? '1 other' : `${totalCount - 1} others`} casted{' '}
          for the first time in a while
        </NotificationTitleText>
      );
    }, [
      firstCast.author,
      group.type,
      pushToUserProfile,
      t.flex,
      t.flexRow,
      t.flexWrap,
      t.fontBold,
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
          <NotificationIcon variant="yellow">
            {(iconColor) => (
              <Octicons name="sun" size={24} style={[{ color: iconColor }]} />
            )}
          </NotificationIcon>
        </View>
        <NotificationGroupInnerContainer>
          <NotificationGroupAvatars actors={users} />
          <View style={[t.flexCol, t.flex]}>{title}</View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

DormantUserNewCastNotificationGroup.displayName =
  'DormantUserNewCastNotificationGroup';

export { DormantUserNewCastNotificationGroup };
