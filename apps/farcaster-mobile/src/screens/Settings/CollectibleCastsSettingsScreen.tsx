import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getNotionLinkTarget,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { PressableSimpleListItem } from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Linking, ScrollView, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type CollectibleCastsSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CollectibleCastsSettings'
>;

const CollectibleCastsSettingsScreen =
  buildScreen<CollectibleCastsSettingsScreenProps>(
    { name: 'CollectibleCastsSettings' },
    () => {
      const t = useTheme();
      const { data } = useUserPreferences();
      const setUserPreference = useSetUserPreferences(true);

      const pref = data.result.preferences.collectibleCastsSetting;

      React.useEffect(() => {
        if (pref === 'no_selection') {
          setUserPreference({
            preferences: {
              collectibleCastsSetting: 'on',
            },
          });
        }
      }, [pref, setUserPreference]);

      const handleOn = useCallback(() => {
        if (pref !== 'on') {
          setUserPreference({
            preferences: {
              collectibleCastsSetting: 'on',
            },
          });
        }
      }, [pref, setUserPreference]);

      const handleOff = useCallback(() => {
        if (pref !== 'off') {
          setUserPreference({
            preferences: {
              collectibleCastsSetting: 'off',
            },
          });
        }
      }, [pref, setUserPreference]);

      return (
        <ScrollView style={[t.hFull]} contentContainerStyle={[t.mB4, t.p4]}>
          <Text2 size="sm" color="tertiary" weight="medium">
            Choose who can bid on your casts by default.{' '}
            <TextWithPress
              style={[t.texts.brand]}
              onPress={() => {
                Linking.openURL(
                  getNotionLinkTarget({
                    to: 'collectible-casts',
                  }),
                );
              }}
            >
              Learn more
            </TextWithPress>
          </Text2>

          <View style={{ marginTop: 12 }}>
            <PressableSimpleListItem
              onPress={handleOn}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isStart={true}
            >
              <Text2>Everyone</Text2>
              {pref === 'on' && <Check size={20} color={t.colors.text.brand} />}
            </PressableSimpleListItem>
            <PressableSimpleListItem
              onPress={handleOff}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isEnd={true}
            >
              <Text2>No one</Text2>
              {pref === 'off' && (
                <Check size={20} color={t.colors.text.brand} />
              )}
            </PressableSimpleListItem>
          </View>
        </ScrollView>
      );
    },
  );

CollectibleCastsSettingsScreen.displayName = 'CollectibleCastsSettingsScreen';

export { CollectibleCastsSettingsScreen };
