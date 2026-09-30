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
import { PushNotificationUserPreferenceUpdateError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type PushNotificationUserPreferences = keyof Pick<
  ApiUserPreferences,
  | 'pushNewDirectCasts'
  | 'pushNewRepliesAndMentions'
  | 'pushFollows'
  | 'pushUnreadNotificationCounts'
  | 'pushRecommendedFollows'
  | 'pushTrendingCasts'
  | 'pushLocationUpdatesForFollowing'
  | 'pushAccountSuggestions'
  | 'pushChannelStreaks'
  | 'pushTrendingOnchain'
  | 'pushWalletActivity'
  | 'pushCampaignAirdrops'
  | 'pushTrendingFollowRecommendations'
  | 'pushAffinityMiniAppRecommendations'
  | 'pushCollectibleCasts'
  | 'pushNewArticle'
>;

const PushNotificationUserPreferences: {
  [key in PushNotificationUserPreferences]: {
    label: string;
    sample: string;
  };
} = {
  pushNewDirectCasts: {
    label: 'Direct casts',
    sample: '@dwr sent you a direct cast',
  },
  pushNewRepliesAndMentions: {
    label: 'Replies & mentions',
    sample: '@dwr replied to your cast',
  },
  pushFollows: {
    label: 'Follows',
    sample: '@dwr is now following you',
  },
  pushUnreadNotificationCounts: {
    label: 'Unread notifications',
    sample: 'You have 100 unread notifications',
  },
  pushRecommendedFollows: {
    label: 'Recommended follows',
    sample: 'New recommended people to follow',
  },
  pushTrendingCasts: {
    label: 'Trending casts',
    sample: '10 new trending casts',
  },
  pushLocationUpdatesForFollowing: {
    label: 'Location updates',
    sample: 'Dan Romero is now in Los Angeles, CA, USA.',
  },
  pushAccountSuggestions: {
    label: 'Account setup suggestions',
    sample: 'Connect your Ethereum wallet to get more followers',
  },
  pushChannelStreaks: {
    label: 'Channel streaks',
    sample: 'Your streak in /farcaster expires in 2 hours!',
  },
  pushTrendingOnchain: {
    label: 'Trending onchain',
    sample: '$ETH is trending',
  },
  pushWalletActivity: {
    label: 'Wallet activity',
    sample: 'Received ETH!',
  },
  pushCampaignAirdrops: {
    label: 'New airdrops',
    sample: "You're eligible for an airdrop!",
  },
  pushTrendingFollowRecommendations: {
    label: 'New follow recommendations',
    sample: 'Your friends are following @dwr!',
  },
  pushAffinityMiniAppRecommendations: {
    label: 'Mini app recommendations',
    sample: '20+ of your friends have tried Bountycaster',
  },
  pushCollectibleCasts: {
    label: 'Collectible casts',
    sample: '@dwr bid on your cast',
  },
  pushNewArticle: {
    label: 'New story',
    sample: '$ZORA listed on Robinhood',
  },
};

type PushNotificationUserPreferenceSwitch = {
  userPreferenceKey: PushNotificationUserPreferences;
  userPreferenceValue: boolean;
};

const PushNotificationUserPreferenceSwitch: FC<
  PushNotificationUserPreferenceSwitch
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
          trackEvent(AnalyticsEvent.EnabledPushNotificationForType, {
            type: userPreferenceKey,
          });
        } else {
          trackEvent(AnalyticsEvent.DisabledPushNotificationForType, {
            type: userPreferenceKey,
          });
        }
      } catch (error) {
        trackError(new PushNotificationUserPreferenceUpdateError({ error }));
        setControlledValue(!value);
      }
    },
    [setUserPreferences, trackEvent, userPreferenceKey],
  );

  const content = PushNotificationUserPreferences[userPreferenceKey];

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
        t.justifyBetween,
      ]}
    >
      <View style={[t.flexGrow, { maxWidth: '85%' }]}>
        <Text style={[t.textBase, t.texts.primary]}>{content.label}</Text>
        <Text style={[t.textSm, t.texts.secondary, t.mT1, t.pR4]}>
          {content.sample}
        </Text>
      </View>
      <Switch
        style={[t.itemsCenter]}
        value={controlledValue}
        onValueChange={onUserPreferenceValueChange}
        newColors
      />
    </View>
  );
};

const GranularPushNotificationsSection: FC = () => {
  const t = useTheme();

  const { data } = useUserPreferences();

  const pushNotificationUserPreferences = useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const getCurrentPreferenceValue = useCallback(
    ({ key }: { key: PushNotificationUserPreferences }) => {
      return pushNotificationUserPreferences[key] || false;
    },
    [pushNotificationUserPreferences],
  );

  return (
    <View style={[t.mT2]}>
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushNewDirectCasts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushNewDirectCasts',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushNewRepliesAndMentions"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushNewRepliesAndMentions',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushFollows"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushFollows',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushUnreadNotificationCounts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushUnreadNotificationCounts',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushRecommendedFollows"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushRecommendedFollows',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushTrendingCasts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushTrendingCasts',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushAccountSuggestions"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushAccountSuggestions',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushWalletActivity"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushWalletActivity',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushTrendingOnchain"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushTrendingOnchain',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushLocationUpdatesForFollowing"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushLocationUpdatesForFollowing',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushChannelStreaks"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushChannelStreaks',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushCampaignAirdrops"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushCampaignAirdrops',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushTrendingFollowRecommendations"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushTrendingFollowRecommendations',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushAffinityMiniAppRecommendations"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushAffinityMiniAppRecommendations',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushCollectibleCasts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushCollectibleCasts',
        })}
      />
      <PushNotificationUserPreferenceSwitch
        userPreferenceKey="pushNewArticle"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'pushNewArticle',
        })}
      />
    </View>
  );
};

export { GranularPushNotificationsSection };
