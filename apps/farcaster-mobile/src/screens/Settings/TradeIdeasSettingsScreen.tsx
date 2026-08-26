import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { PressableSimpleListItem, Text } from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type TradeIdeasSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TradeIdeasSettings'
>;

const TradeIdeasSettingsScreen = buildScreen<TradeIdeasSettingsScreenProps>(
  { name: 'TradeIdeasSettings' },
  () => {
    const t = useTheme();

    return (
      <ScrollView style={[t.hFull]} contentContainerStyle={[t.mB4, t.p4]}>
        <TradeIdeasSettings />
      </ScrollView>
    );
  },
);

TradeIdeasSettingsScreen.displayName = 'TradeIdeasSettingsScreen';

export function TradeIdeasSettings() {
  const t = useTheme();

  const { data } = useUserPreferences();

  const setUserPreference = useSetUserPreferences(true);

  const pref = data.result.preferences.optOutTradeIdeas;

  const [controlledValue, setControlledValue] = React.useState<boolean>(
    pref || false,
  );

  React.useEffect(() => {
    setControlledValue(pref || false);
  }, [pref]);

  const { trackEvent } = useAnalytics();

  const handleOn = useCallback(() => {
    trackEvent(AnalyticsEvent.TurnOnTradeIdeasNudge, {});

    setControlledValue(false);

    setUserPreference({
      preferences: {
        optOutTradeIdeas: false,
      },
    });
  }, [setUserPreference, trackEvent]);

  const handleOff = useCallback(() => {
    trackEvent(AnalyticsEvent.TurnOffTradeIdeasNudge, {});

    setControlledValue(true);

    setUserPreference({
      preferences: {
        optOutTradeIdeas: true,
      },
    });
  }, [setUserPreference, trackEvent]);

  return (
    <View style={[t.flexCol]}>
      <Text style={[t.texts.tertiary, t.textBase]}>
        Trade ideas feed unread article markers and Clanker Spotlight
        notifications.
      </Text>
      <View style={{ marginTop: 12 }}>
        <PressableSimpleListItem
          onPress={handleOn}
          style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
          isStart={true}
        >
          <Text2>On</Text2>
          {controlledValue === false && (
            <Check size={20} color={t.colors.text.brand} />
          )}
        </PressableSimpleListItem>
        <PressableSimpleListItem
          onPress={handleOff}
          style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
          isEnd={true}
        >
          <Text2>Off</Text2>
          {controlledValue !== false && (
            <Check size={20} color={t.colors.text.brand} />
          )}
        </PressableSimpleListItem>
      </View>
    </View>
  );
}

export { TradeIdeasSettingsScreen };
