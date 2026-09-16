import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiSetLocationNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type SetLocationNotificationGroupProps = {
  group: ApiSetLocationNotificationGroup;
};

const SetLocationNotificationGroup: FC<SetLocationNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const navigate = useNavigate();
    const { trackEvent } = useTrackEvent();

    const onSetLocationPress = React.useCallback(async () => {
      navigate('EditLocation', {});
    }, [navigate]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={onSetLocationPress}
      >
        <NotificationIcon variant="blue">
          {(iconColor) => (
            <Octicons
              name="location"
              size={16}
              style={[{ color: iconColor }]}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.flex1, t.flexCol, t.justifyCenter, t.hFull]}>
            <Text style={[t.mR1, t.texts.primary, t.mB1, t.fontSemibold]}>
              Find other Farcasters nearby
            </Text>
            <Text style={[t.mR1, t.texts.primary, t.mB2]}>
              By setting your location, you'll get a list of other Farcasters
              nearby and updates whenever someone you follow comes to your city.
            </Text>
            <Button
              onPress={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: group.type,
                });

                onSetLocationPress();
              }}
              title={'Set location'}
              variant="normal"
              size="xs"
              style={[t.w32]}
            />
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

SetLocationNotificationGroup.displayName = 'SetLocationNotificationGroup';

export { SetLocationNotificationGroup };
