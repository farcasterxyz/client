import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserPreferences } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React from 'react';

import { Toggle } from '~/components/forms/Toggle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { trackError } from '~/utils/errorUtils';

type InAppNotificationUserPreferences = keyof Pick<
  ApiUserPreferences,
  | 'inAppLinkNearby'
  | 'inAppChannelStreaks'
  | 'inAppFeaturedFrames'
  | 'inAppTrendingOnchain'
  | 'inAppWalletActivity'
  | 'inAppNewArticle'
  | 'inAppStorageWarnings'
>;

const InAppNotificationUserPreferences: {
  [key in InAppNotificationUserPreferences]: {
    label: string;
    sample: string;
  };
} = {
  inAppLinkNearby: {
    label: 'Nearby',
    sample: 'Dan Romero is in Los Angeles, CA',
  },
  inAppChannelStreaks: {
    label: 'Channel streaks',
    sample: 'Keep your streak in /farcaster',
  },
  inAppFeaturedFrames: {
    label: 'Featured Mini Apps',
    sample: 'Yoink is trending',
  },
  inAppTrendingOnchain: {
    label: 'Trending onchain',
    sample: '$ETH is trending',
  },
  inAppWalletActivity: {
    label: 'Wallet activity',
    sample: 'Received ETH!',
  },
  inAppNewArticle: {
    label: 'New story',
    sample: '$ZORA listed on Robinhood',
  },
  inAppStorageWarnings: {
    label: 'Storage warnings',
    sample: 'Cast storage is almost full',
  },
};

type InAppNotificationUserPreferenceSwitch = {
  userPreferenceKey: InAppNotificationUserPreferences;
  userPreferenceValue: boolean;
};

const InAppNotificationUserPreferenceSwitch: React.FC<
  InAppNotificationUserPreferenceSwitch
> = ({ userPreferenceKey, userPreferenceValue }) => {
  const { trackEvent } = useAnalytics();

  const setUserPreferences = useSetUserPreferences();

  // Having a controlled value like this helps the switch value
  // not to flicker when changing.
  const [controlledValue, setControlledValue] =
    React.useState<boolean>(userPreferenceValue);

  const onUserPreferenceValueChange = React.useCallback(
    async (value: boolean) => {
      setControlledValue(value);

      try {
        await setUserPreferences({
          preferences: { [userPreferenceKey]: value },
        });

        if (value) {
          trackEvent(AnalyticsEvent.EnabledInAppNotificationForType, {
            type: userPreferenceKey,
          });
        } else {
          trackEvent(AnalyticsEvent.DisabledInAppNotificationForType, {
            type: userPreferenceKey,
          });
        }
      } catch (error) {
        setControlledValue(!value);

        trackError(error);
      }
    },
    [setUserPreferences, trackEvent, userPreferenceKey],
  );

  const content = InAppNotificationUserPreferences[userPreferenceKey];

  return (
    <Toggle
      label={content.label}
      description={content.sample}
      value={controlledValue}
      onValueChange={onUserPreferenceValueChange}
    />
  );
};

const GranularInAppNotificationsSection: React.FC = () => {
  const { data } = useUserPreferences();

  const inAppNotificationUserPreferences = React.useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const getCurrentPreferenceValue = React.useCallback(
    ({ key }: { key: InAppNotificationUserPreferences }) => {
      return inAppNotificationUserPreferences[key] || false;
    },
    [inAppNotificationUserPreferences],
  );

  return (
    <div className="mb-2 flex flex-col">
      <div className="mb-4 flex flex-col">
        <span className="font-semibold">In-app notifications</span>
      </div>
      <div className="flex flex-col space-y-2">
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppFeaturedFrames"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppFeaturedFrames',
          })}
        />
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppWalletActivity"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppWalletActivity',
          })}
        />
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppTrendingOnchain"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppTrendingOnchain',
          })}
        />
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppLinkNearby"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppLinkNearby',
          })}
        />
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppChannelStreaks"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppChannelStreaks',
          })}
        />
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppNewArticle"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppNewArticle',
          })}
        />
        <InAppNotificationUserPreferenceSwitch
          userPreferenceKey="inAppStorageWarnings"
          userPreferenceValue={getCurrentPreferenceValue({
            key: 'inAppStorageWarnings',
          })}
        />
      </div>
    </div>
  );
};

export { GranularInAppNotificationsSection };
