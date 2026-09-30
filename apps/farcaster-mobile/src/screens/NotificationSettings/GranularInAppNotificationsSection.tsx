import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserPreferences } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { InAppNotificationUserPreferenceUpdateError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type InAppNotificationUserPreferences = keyof Pick<
  ApiUserPreferences,
  | 'inAppLinkNearby'
  | 'inAppChannelStreaks'
  | 'inAppFeaturedFrames'
  | 'inAppTrendingOnchain'
  | 'inAppTrendingFollowRecommendations'
  | 'inAppWalletActivity'
  | 'inAppCollectibleCasts'
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
  inAppTrendingFollowRecommendations: {
    label: 'New follow recommendations',
    sample: 'Your friends are following @dwr!',
  },
  inAppWalletActivity: {
    label: 'Wallet activity',
    sample: 'Received ETH!',
  },
  inAppCollectibleCasts: {
    label: 'Collectible casts',
    sample: '@dwr bid on your cast',
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

const InAppNotificationUserPreferenceSwitch: FC<
  InAppNotificationUserPreferenceSwitch
> = ({ userPreferenceKey, userPreferenceValue }) => {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const setUserPreferences = useSetUserPreferences();

  // Having a controlled value like this helps the switch value
  // not to flicker when changing.
  const [controlledValue, setControlledValue] =
    useState<boolean>(userPreferenceValue);

  const onUserPreferenceValueChange = useCallback(
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
        trackError(new InAppNotificationUserPreferenceUpdateError({ error }));
        setControlledValue(!value);
      }
    },
    [setUserPreferences, trackEvent, userPreferenceKey],
  );

  const content = InAppNotificationUserPreferences[userPreferenceKey];

  return (
    <View
      style={[
        t.bgDefault,
        t.flex,
        t.flexRow,
        t.wFull,
        t.itemsCenter,
        t.pY2,
        t.pR4,
        t.roundedLg,
        t.mB2,
      ]}
    >
      <View style={[t.flexGrow]}>
        <Text style={[t.textBase, t.texts.primary]}>{content.label}</Text>
        <Text style={[t.textSm, t.texts.secondary, t.mT1, { maxWidth: '90%' }]}>
          {content.sample}
        </Text>
      </View>
      <Switch
        value={controlledValue}
        onValueChange={onUserPreferenceValueChange}
        newColors
      />
    </View>
  );
};

const GranularInAppNotificationsSection: FC = () => {
  const t = useTheme();

  const { data } = useUserPreferences();

  const inAppNotificationUserPreferences = useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const getCurrentPreferenceValue = useCallback(
    ({ key }: { key: InAppNotificationUserPreferences }) => {
      return inAppNotificationUserPreferences[key] || false;
    },
    [inAppNotificationUserPreferences],
  );

  return (
    <View style={[t.mT2]}>
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
        userPreferenceKey="inAppFeaturedFrames"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'inAppFeaturedFrames',
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
        userPreferenceKey="inAppTrendingFollowRecommendations"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'inAppTrendingFollowRecommendations',
        })}
      />
      <InAppNotificationUserPreferenceSwitch
        userPreferenceKey="inAppCollectibleCasts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'inAppCollectibleCasts',
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
    </View>
  );
};

export { GranularInAppNotificationsSection };
