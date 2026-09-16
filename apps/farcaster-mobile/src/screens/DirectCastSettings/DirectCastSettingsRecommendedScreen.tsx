import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiDirectCastInboxPreference } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useTrackEvent,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { SelectOne } from '~/components/settings/SelectOne';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type DirectCastSettingsRecommendedScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DirectCastSettingsRecommended'
>;

const DirectCastSettingsRecommendedScreen =
  buildScreen<DirectCastSettingsRecommendedScreenProps>(
    { name: 'DirectCastSettingsRecommended' },
    () => {
      const t = useTheme();
      const { trackEvent } = useTrackEvent();
      const { data } = useUserPreferences();
      const setUserPreferences = useSetUserPreferences();

      const userPreferences = useMemo(() => {
        return data?.result.preferences || {};
      }, [data?.result.preferences]);

      const [controlledValue, setControlledValue] =
        useState<ApiDirectCastInboxPreference>(
          userPreferences.recommendDirectCastInbox ?? 'primary',
        );

      const onUserPreferenceValueChange = useCallback(
        async (value: ApiDirectCastInboxPreference) => {
          const previous = controlledValue;
          setControlledValue(value);

          try {
            await setUserPreferences({
              preferences: { ['recommendDirectCastInbox']: value },
            });

            trackEvent({
              name: 'update direct cast inbox preference',
              props: {
                classification: 'recommended',
                preference: value,
              },
            });
          } catch (error) {
            trackError(error);
            setControlledValue(previous);
          }
        },
        [controlledValue, setUserPreferences, trackEvent],
      );

      return (
        <ScrollView style={[t.hFull, t.pT4]}>
          <View style={[t.mB4, t.mT2, t.pX4]}>
            <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
              Choose whether suggested users can send you messages
            </Text>
          </View>
          <SelectOne
            options={[
              { value: 'primary', title: 'Allow' },
              {
                value: 'request',
                title: 'Request only',
              },
              {
                value: 'block',
                title: `Don't allow`,
              },
            ]}
            value={controlledValue}
            onChange={onUserPreferenceValueChange}
          />
        </ScrollView>
      );
    },
  );

DirectCastSettingsRecommendedScreen.displayName =
  'DirectCastSettingsRecommendedScreen';

export { DirectCastSettingsRecommendedScreen };
