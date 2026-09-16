import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCreatorRewardNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { creatorRewardPromptKey } from '~/constants/Storage';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CreatorRewardNotificationGroupProps = {
  group: ApiCreatorRewardNotificationGroup;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const CreatorRewardNotificationGroup: FC<CreatorRewardNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { trackEvent } = useTrackEvent();
    const { showGlobalPrompt } = useGlobalPrompts();

    return (
      <>
        <NotificationGroupOuterContainer
          group={group}
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: group.type,
            });

            showGlobalPrompt({
              key: creatorRewardPromptKey,
              globalPromptData: {
                creatorReward: group.previewItems[0].content,
              },
            });
          }}
        >
          <NotificationIcon variant="purple">
            {(iconColor) => (
              <Octicons name="gift" size={16} style={[{ color: iconColor }]} />
            )}
          </NotificationIcon>
          <NotificationGroupInnerContainer>
            <View style={[t.flexCol]}>
              <Text style={[t.texts.primary, t.fontSemibold]}>
                You earned{' '}
                {Math.floor(group.previewItems[0].content.rewardCents / 100)}{' '}
                USDC!
              </Text>
              <Text style={[t.texts.secondary, t.mT1]}>
                Farcaster sent you a reward for being a top caster on{' '}
                {dateFormatter.format(
                  new Date(group.previewItems[0].content.rewardDate),
                )}
                .
              </Text>
            </View>
          </NotificationGroupInnerContainer>
        </NotificationGroupOuterContainer>
      </>
    );
  });

CreatorRewardNotificationGroup.displayName = 'CreatorRewardNotificationGroup';

export { CreatorRewardNotificationGroup };
