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
import { trackError } from '~/utils/ErrorUtils';

type EmailSubscriptionCategory = keyof Pick<
  ApiUserPreferences,
  | 'emailUnreadMessages'
  | 'emailPopularCasts'
  | 'emailRecommendedUsers'
  | 'emailNewFeatures'
  | 'emailInviteStatusUpdates'
  | 'emailBookmarkedCasts'
>;

const EmailSubscriptionCategoryUserPreferences: {
  [key in EmailSubscriptionCategory]: {
    label: string;
    sample: string;
  };
} = {
  emailUnreadMessages: {
    label: 'Unread messages',
    sample:
      'Daily email only if you have unread mentions, replies or direct casts',
  },
  emailPopularCasts: {
    label: 'Popular casts',
    sample: 'Weekly email with three popular casts from your network',
  },
  emailBookmarkedCasts: {
    label: 'Bookmarks',
    sample: 'Weekly email with your bookmarked casts',
  },
  emailRecommendedUsers: {
    label: 'Recommended users',
    sample:
      'Weekly email with a new user or channel to follow based on your interests',
  },
  emailNewFeatures: {
    label: 'New features',
    sample:
      'Email whenever new new major features or protocol changes are released',
  },
  emailInviteStatusUpdates: {
    label: 'Invites',
    sample: "Get an email whenever someone accepts an invite you've sent out",
  },
};

type EmailSubscriptionCategoryUserPreferenceSwitch = {
  userPreferenceKey: EmailSubscriptionCategory;
  userPreferenceValue: boolean;
};

const EmailSubscriptionCategoryUserPreferenceSwitch: FC<
  EmailSubscriptionCategoryUserPreferenceSwitch
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
          trackEvent(AnalyticsEvent.EnabledEmailNotificationForCategory, {
            type: userPreferenceKey,
          });
        } else {
          trackEvent(AnalyticsEvent.DisabledEmailNotificationForCategory, {
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

  const content = EmailSubscriptionCategoryUserPreferences[userPreferenceKey];

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
      <View style={[t.flex1, { width: '100%' }, t.flexGrow]}>
        <Text style={[t.textBase, t.texts.primary]}>{content.label}</Text>
        <Text style={[t.textSm, t.texts.secondary, t.mT1, { maxWidth: '90%' }]}>
          {content.sample}
        </Text>
      </View>
      <View style={[]}>
        <Switch
          value={controlledValue}
          onValueChange={onUserPreferenceValueChange}
          newColors
        />
      </View>
    </View>
  );
};

const GranularEmailNotificationsSection: FC = () => {
  const t = useTheme();

  const { data } = useUserPreferences();

  const emailNotificationUserPreferences = useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const getCurrentPreferenceValue = useCallback(
    ({ key }: { key: EmailSubscriptionCategory }) => {
      return emailNotificationUserPreferences[key] || false;
    },
    [emailNotificationUserPreferences],
  );

  return (
    <View style={[t.mT2]}>
      <EmailSubscriptionCategoryUserPreferenceSwitch
        userPreferenceKey="emailUnreadMessages"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'emailUnreadMessages',
        })}
      />
      <EmailSubscriptionCategoryUserPreferenceSwitch
        userPreferenceKey="emailPopularCasts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'emailPopularCasts',
        })}
      />
      <EmailSubscriptionCategoryUserPreferenceSwitch
        userPreferenceKey="emailBookmarkedCasts"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'emailBookmarkedCasts',
        })}
      />
      <EmailSubscriptionCategoryUserPreferenceSwitch
        userPreferenceKey="emailRecommendedUsers"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'emailRecommendedUsers',
        })}
      />
      <EmailSubscriptionCategoryUserPreferenceSwitch
        userPreferenceKey="emailNewFeatures"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'emailNewFeatures',
        })}
      />
      <EmailSubscriptionCategoryUserPreferenceSwitch
        userPreferenceKey="emailInviteStatusUpdates"
        userPreferenceValue={getCurrentPreferenceValue({
          key: 'emailInviteStatusUpdates',
        })}
      />
    </View>
  );
};

export { GranularEmailNotificationsSection };
