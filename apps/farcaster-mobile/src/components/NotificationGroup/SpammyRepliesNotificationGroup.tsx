import { Ionicons } from '@expo/vector-icons';
import { ApiSpammyRepliesNotificationGroup } from 'farcaster-client-data';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type SpammyRepliesNotificationGroupProps = {
  group: ApiSpammyRepliesNotificationGroup;
};

const SpammyRepliesNotificationGroup: FC<SpammyRepliesNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

    return (
      <NotificationGroupOuterContainer group={group} onPress={() => {}}>
        <NotificationIcon variant="yellow">
          {(iconColor) => (
            <Ionicons name="flag" size={16} style={[{ color: iconColor }]} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.mR1, t.flex, t.flexRow, t.texts.primary, t.flexWrap]}>
            <Text style={[t.texts.primary]}>
              Warning: your account is at risk of being labelled spammy
            </Text>
            <View style={[t.mT2]}>
              <Button
                onPress={async () => {
                  possiblyNavigateOrOpenUrl({
                    url: getNotionLinkTarget({ to: 'spammy-replies' }),
                  });
                }}
                title={'Learn more'}
                variant="muted"
                size="xs"
                style={[t.flexGrow0, t.mY1]}
              />
            </View>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

SpammyRepliesNotificationGroup.displayName = 'SpammyRepliesNotificationGroup';

export { SpammyRepliesNotificationGroup };
