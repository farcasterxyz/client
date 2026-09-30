import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserPreferenceNotificationsInbox } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { SelectOne } from '~/components/settings/SelectOne';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { trackError } from '~/utils/ErrorUtils';

function NotificationsModeSetting() {
  const t = useTheme();

  const toast = useRootToast();

  const { trackEvent } = useAnalytics();

  const { data } = useUserPreferences();

  const setUserPreferences = useSetUserPreferences();

  const defaultFilterPreference = React.useMemo(() => {
    return data.result.preferences.notificationsInbox || 'moderate';
  }, [data?.result.preferences]);

  const [controlledFilterValue, setControlledFilterValue] =
    React.useState<ApiUserPreferenceNotificationsInbox>(
      defaultFilterPreference,
    );

  const onFilterPreferenceValueChange = React.useCallback(
    async (value: ApiUserPreferenceNotificationsInbox) => {
      setControlledFilterValue(value);

      trackEvent(AnalyticsEvent.SetNotificationsInboxFilterLevel, {
        type: value,
      });

      try {
        await setUserPreferences({
          preferences: { notificationsInbox: value },
        });

        toast.show('Restart your app to see your updated notifications feed!');
      } catch (error) {
        trackError(error);
      }
    },
    [setUserPreferences, toast, trackEvent],
  );

  return (
    <View style={[t.pX4]}>
      <View style={[t.flex, t.flexCol]}>
        <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
          <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
            Notifications filter
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
            t.borderFaint,
            t.border,
            t.mB2,
            t.mT2,
          ]}
        >
          <SelectOne
            style={[t.flexGrow]}
            options={[
              {
                value: 'aggressive',
                title: 'High',
                subtitle: "Show notifications I'm likely to be interested in.",
              },
              {
                value: 'moderate',
                title: 'Medium',
                subtitle: 'Show notifications from most users.',
              },
              {
                value: 'none',
                title: 'Low',
                subtitle: 'Show notifications from all users (excluding spam).',
              },
            ]}
            value={controlledFilterValue}
            onChange={onFilterPreferenceValueChange}
            hideDividerOnLastOption
          />
        </View>
      </View>
    </View>
  );
}

export { NotificationsModeSetting };
