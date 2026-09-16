import { ApiChannelStreakUpdateNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { ChannelStreaksIcon } from '~/components/images/ChannelStreaksIcon';
import { Text } from '~/components/Text';
import { aboutChannelStreakPromptKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ChannelStreakUpdateNotificationGroupProps = {
  group: ApiChannelStreakUpdateNotificationGroup;
};

const ChannelStreakUpdateNotificationGroup: FC<ChannelStreakUpdateNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const { showGlobalPrompt } = useGlobalPrompts();

    const streak = React.useMemo(
      () => group.previewItems[0].content.streak,
      [group.previewItems],
    );

    const streakSummary = React.useMemo(() => {
      if (streak.streakCount <= 1) {
        return `Started streak in /${streak.channel.key} (1 day)`;
      }

      return `Streak in /${streak.channel.key} continued! (${streak.streakCount} days)`;
    }, [streak.channel.key, streak.streakCount]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          showGlobalPrompt({ key: aboutChannelStreakPromptKey });
        }}
      >
        <NotificationIcon variant="yellow">
          {(iconColor) => (
            <ChannelStreaksIcon height={20} width={20} color={iconColor} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View
            style={[
              t.mR1,
              t.flex,
              t.flexRow,
              t.texts.primary,
              t.flexWrap,
              t.mT1,
            ]}
          >
            <Text style={[t.texts.primary, t.fontSemibold]}>
              {streakSummary}
            </Text>
          </View>
          <View style={[t.mT2, t.flex, t.flexRow, { gap: 8 }]}>
            <Text style={[t.textSm, t.texts.brand]}>View streak details</Text>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ChannelStreakUpdateNotificationGroup.displayName =
  'ChannelStreakUpdateNotificationGroup';

export { ChannelStreakUpdateNotificationGroup };
