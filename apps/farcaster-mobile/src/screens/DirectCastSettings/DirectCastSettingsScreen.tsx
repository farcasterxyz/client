import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { openBrowserAsync } from 'expo-web-browser';
import { ApiDirectCastsFilterLevelPreference } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { AnimatedPressable, InfoIcon } from 'farcaster-expo';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { SelectOne } from '~/components/settings/SelectOne';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type DirectCastSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DirectCastSettings'
>;

const DirectCastSettingsScreen = buildScreen<DirectCastSettingsScreenProps>(
  { name: 'DirectCastSettings' },
  () => {
    const t = useTheme();
    const push = usePush();

    const { data } = useUserPreferences();
    const setUserPreferences = useSetUserPreferences();

    const defaultDirectCastsFilterLevelPreference = React.useMemo(() => {
      return data?.result.preferences.directCastsFilterLevel;
    }, [data?.result.preferences]);

    const [controlledFilterValue, setControlledFilterValue] =
      React.useState<ApiDirectCastsFilterLevelPreference>(
        defaultDirectCastsFilterLevelPreference || 'medium',
      );

    const onDirectCastsFilterLevelChange = React.useCallback(
      async (value: ApiDirectCastsFilterLevelPreference) => {
        setControlledFilterValue(value);

        try {
          await setUserPreferences({
            preferences: { directCastsFilterLevel: value },
          });
        } catch (error) {
          trackError(error);
        }
      },
      [setUserPreferences],
    );

    return (
      <ScrollView style={[t.hFull, t.pT4, t.pX3]}>
        <View style={[t.flex, t.flexCol]}>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold, t.mB4]}>
            Notifications
          </Text>
          <TouchableOpacity
            style={[
              t._mX3,
              t.p3,
              t.pY4,
              t.borderB,
              t.borderDefault,
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
            ]}
            activeOpacity={0.75}
            onPress={() => {
              push('NotificationSettings', {});
            }}
          >
            <Text style={[t.textBase, t.texts.primary]}>
              Push notifications
            </Text>
            <Octicons
              name="chevron-right"
              size={18}
              style={[t.texts.tertiary, t.fontSemibold]}
            />
          </TouchableOpacity>
        </View>
        <View style={[t.mB4, t.mT6]}>
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
              Direct Cast delivery
            </Text>
            <AnimatedPressable
              style={[
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.itemsCenter,
                t.h8,
                t.w6,
                t.mL1,
                t.roundedLg,
              ]}
              onPress={async () => {
                openBrowserAsync(
                  getNotionLinkTarget({ to: 'direct-casts-requests' }),
                );
              }}
            >
              <InfoIcon size={16} style={[t.texts.tertiary]} />
            </AnimatedPressable>
          </View>
          <Text style={[t.texts.secondary, t.textXs, t.mT4]}>
            Choose how direct casts are filtered:
          </Text>
        </View>
        <View
          style={[
            t.bgDefault,
            t.flex,
            t.flexRow,
            t.wFull,
            t.itemsCenter,
            t.roundedLg,
            t.borderHairline,
            t.borderDefault,
            t.mB2,
            t.mT2,
            t._mX3,
          ]}
        >
          <SelectOne
            style={[t.flexGrow]}
            options={[
              {
                value: 'high',
                title: 'High',
                subtitle: 'Only allow messages from people you follow.',
              },
              {
                value: 'medium',
                title: 'Medium',
                subtitle:
                  'Allow messages from people you follow and suggested users.',
              },
              {
                value: 'low',
                title: 'Low',
                subtitle: 'Show direct casts from all users.',
              },
            ]}
            value={controlledFilterValue}
            onChange={onDirectCastsFilterLevelChange}
            hideDividerOnLastOption
          />
        </View>
      </ScrollView>
    );
  },
);

DirectCastSettingsScreen.displayName = 'DirectCastSettingsScreen';

export { DirectCastSettingsScreen };
