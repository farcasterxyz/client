import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserPreferenceNotificationsInbox } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React from 'react';

import { SelectOne } from '~/components/forms/SelectOne';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

function NotificationsModeSetting() {
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

        toast({
          message: 'Refresh to see your updated notifications feed!',
          toastId: 'updated-notif-feed',
        });
      } catch (error) {
        trackError(error);
      }
    },
    [setUserPreferences, trackEvent],
  );

  return (
    <div className="mx-2 mb-2 flex flex-col">
      <div className="mt-4 flex flex-col">
        <span className="font-semibold">Notifications filter</span>
      </div>
      <div className="flex flex-col">
        <div className="-mx-4">
          <SelectOne
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
          />
        </div>
      </div>
    </div>
  );
}

export { NotificationsModeSetting };
