import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserPreferenceCastsShown } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { SelectOne } from '~/components/settings/SelectOne';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type CastsAndUsersSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CastsAndUsersSettings'
>;

const CastsAndUsersSettingsScreen =
  buildScreen<CastsAndUsersSettingsScreenProps>(
    { name: 'CastsAndUsersSettings' },
    () => {
      return <CastsAndUsersSettingsContent />;
    },
  );
CastsAndUsersSettingsScreen.displayName = 'CastsAndUsersSettingsScreen';

const CastsAndUsersSettingsContent: FC = memo(() => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();

  const { data } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();

  const [threadValue, setThreadValue] = useState<ApiUserPreferenceCastsShown>(
    data?.result.preferences.conversationRepliesShown || 'priority',
  );

  useEffect(() => {
    setThreadValue(
      data?.result.preferences.conversationRepliesShown || 'priority',
    );
  }, [data]);

  const onThreadValueChange = useCallback(
    async (value: ApiUserPreferenceCastsShown) => {
      if (value === threadValue) {
        // User is tapping same value
        return;
      }

      const previous = threadValue;

      // Optimistically update
      setThreadValue(value);

      try {
        await setUserPreferences({
          preferences: { conversationRepliesShown: value },
        });

        trackEvent(AnalyticsEvent.SetSettingConversationRepliesShown, {
          value,
        });
      } catch (error) {
        trackError(error);
        setThreadValue(previous);
      }
    },
    [threadValue, setUserPreferences, trackEvent],
  );

  return (
    <ScrollView style={[t.hFull, t.pT4]}>
      <View style={[t.flex, t.flexCol]}>
        <SelectOne
          title={
            <>
              Show me replies from
              <TouchableOpacity
                style={[t.textSm, t.fontNormal, t.pL2, { marginBottom: -1 }]}
                hitSlop={hitSlop}
                activeOpacity={0.5}
                onPress={() => {
                  Linking.openURL(getNotionLinkTarget({ to: 'priority-mode' }));
                }}
              >
                <Octicons
                  name="info"
                  size={14}
                  color={t.colors.text.tertiary}
                />
              </TouchableOpacity>
            </>
          }
          options={[
            { value: 'all', title: 'Everyone' },
            {
              value: 'priority',
              title: 'Priority',
              subtitle: 'People I follow + Recommended',
            },
          ]}
          value={threadValue}
          onChange={onThreadValueChange}
          style={[t.mB6]}
        />
      </View>
    </ScrollView>
  );
});

export { CastsAndUsersSettingsScreen };
