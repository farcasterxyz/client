import { ApiChannelStreakEndedNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { ChannelStreaksIcon } from '~/components/images/ChannelStreaksIcon';
import { Text } from '~/components/Text';
import { startChannelStreakPromptKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ChannelStreakEndedNotificationGroupProps = {
  group: ApiChannelStreakEndedNotificationGroup;
};

const ChannelStreakEndedNotificationGroup: FC<ChannelStreakEndedNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const { showGlobalPrompt } = useGlobalPrompts();

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          showGlobalPrompt({ key: startChannelStreakPromptKey });
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
            <Text style={[t.texts.primary, t.fontSemibold]}>Streak ended</Text>
          </View>
          <View style={[t.mT2, t.flex, t.flexRow, { gap: 8 }]}>
            <Text style={[t.textSm, t.texts.brand]}>Start new streak</Text>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ChannelStreakEndedNotificationGroup.displayName =
  'ChannelStreakEndedNotificationGroup';

export { ChannelStreakEndedNotificationGroup };
