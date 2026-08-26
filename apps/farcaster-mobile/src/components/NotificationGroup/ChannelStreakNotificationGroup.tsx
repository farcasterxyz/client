import formatDistanceToNowStrict from 'date-fns/formatDistanceToNowStrict';
import { ApiChannelStreakNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { ChannelStreaksIcon } from '~/components/images/ChannelStreaksIcon';
import { Text, Text2 } from '~/components/Text';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ChannelStreakNotificationGroupProps = {
  group: ApiChannelStreakNotificationGroup;
};

const ChannelStreakNotificationGroup: FC<ChannelStreakNotificationGroupProps> =
  memo(({ group }) => {
    const openComposer = useOpenComposer();

    const t = useTheme();

    const firstPreviewItem = React.useMemo(
      () => group.previewItems[0],
      [group.previewItems],
    );

    const title = React.useMemo(() => {
      const metadata = firstPreviewItem.content.streak.metadata;

      if (typeof metadata === 'undefined') {
        return 'Keep your streak';
      }

      if (firstPreviewItem.content.streak.streakCount === 0) {
        return `Keep your streak in /${firstPreviewItem.content.streak.channel.key}`;
      }

      return `Keep your streak in /${firstPreviewItem.content.streak.channel.key} (${firstPreviewItem.content.streak.streakCount} ${firstPreviewItem.content.streak.streakCount === 1 ? 'day' : 'days'})`;
    }, [
      firstPreviewItem.content.streak.channel.key,
      firstPreviewItem.content.streak.metadata,
      firstPreviewItem.content.streak.streakCount,
    ]);

    const body = React.useMemo(() => {
      const metadata = firstPreviewItem.content.streak.metadata;

      if (
        typeof metadata === 'undefined' &&
        firstPreviewItem.content.streak.streakCount !== 0
      ) {
        return `You've casted for ${firstPreviewItem.content.streak.streakCount} ${firstPreviewItem.content.streak.streakCount === 1 ? 'day' : 'days'} in /${firstPreviewItem.content.streak.channel.key}.`;
      }

      if (typeof metadata === 'undefined') {
        return null;
      }

      // Use date-fns for relative time formatting
      const expiresInHours = formatDistanceToNowStrict(
        new Date(metadata.expiresAtTimestamp),
      );

      return `Your streak expires in ${expiresInHours}.`;
    }, [
      firstPreviewItem.content.streak.channel.key,
      firstPreviewItem.content.streak.metadata,
      firstPreviewItem.content.streak.streakCount,
    ]);

    const onCastNowPress = React.useCallback(() => {
      openComposer(
        createCastParamsWithIntent({
          channelKey: firstPreviewItem.content.streak.channel.key,
        }),
      );
    }, [firstPreviewItem.content.streak.channel.key, openComposer]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={onCastNowPress}>
        <NotificationIcon variant="yellow">
          {(iconColor) => (
            <ChannelStreaksIcon height={20} width={20} color={iconColor} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.mR1, t.flex, t.flexRow, t.texts.primary, t.flexWrap]}>
            <Text style={[t.texts.primary, t.fontSemibold]}>{title}</Text>
          </View>
          <View style={[t.mT2]}>
            <Text2 color="secondary">{body}</Text2>
          </View>
          <View style={[t.mT2, t.flex, t.flexRow, { gap: 8 }]}>
            <Text style={[t.textSm, t.texts.brand]}>Cast now</Text>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ChannelStreakNotificationGroup.displayName = 'ChannelStreakNotificationGroup';

export { ChannelStreakNotificationGroup };
