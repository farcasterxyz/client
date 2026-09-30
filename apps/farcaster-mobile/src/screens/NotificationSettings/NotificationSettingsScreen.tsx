import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { NotificationsModeSetting } from '~/screens/NotificationSettings/NotificationsModeSetting';
import { TradeIdeasSettings } from '~/screens/Settings/TradeIdeasSettingsScreen';
import { CommonStackParamList } from '~/types';

import { EmailSection } from './EmailSection';
import { GranularEmailNotificationsSection } from './GranularEmailNotificationsSection';
import { GranularInAppNotificationsSection } from './GranularInAppNotificationsSection';
import { PushNotificationsSection } from './PushNotificationsSection';

type NotificationSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'NotificationSettings'
>;

const NotificationSettingsScreen = buildScreen<NotificationSettingsScreenProps>(
  { name: 'NotificationSettings' },
  () => {
    const t = useTheme();
    const insets = useSafeAreaInsets();

    return (
      <ScrollView
        style={[t.hFull]}
        contentContainerStyle={[t.mB4, { paddingBottom: insets.bottom }]}
      >
        <NotificationsModeSetting />
        <Divider marginVertical="normal" />
        <PushNotificationsSection />
        <Divider marginVertical="normal" />
        <View style={[t.pX4]}>
          <View style={[t.flex, t.flexCol]}>
            <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
              <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
                In-app notifications
              </Text>
            </View>
            <GranularInAppNotificationsSection />
          </View>
        </View>
        <Divider marginVertical="normal" />
        <View style={[t.pX4]}>
          <View style={[t.flex, t.flexCol]}>
            <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
              <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
                Email notifications
              </Text>
            </View>
            <GranularEmailNotificationsSection />
          </View>
        </View>
        <Divider marginVertical="normal" />
        <EmailSection />
        <Divider marginVertical="normal" />
        <View style={[t.pX3]}>
          <View style={[t.flex, t.flexCol]}>
            <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
              <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
                Trade ideas and Clanker Spotlight
              </Text>
            </View>
            <TradeIdeasSettings />
          </View>
        </View>
      </ScrollView>
    );
  },
);

NotificationSettingsScreen.displayName = 'NotificationSettingsScreen';

export { NotificationSettingsScreen };
