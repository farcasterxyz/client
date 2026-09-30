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

const EmailSubscriptionCategoryUserPreferenceSwitch: React.FC<
  EmailSubscriptionCategoryUserPreferenceSwitch
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
    <Toggle
      label={content.label}
      description={content.sample}
      value={controlledValue}
      onValueChange={onUserPreferenceValueChange}
    />
  );
};

const GranularEmailNotificationsSection: React.FC = () => {
  const { data } = useUserPreferences();

  const emailNotificationUserPreferences = React.useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const getCurrentPreferenceValue = React.useCallback(
    ({ key }: { key: EmailSubscriptionCategory }) => {
      return emailNotificationUserPreferences[key] || false;
    },
    [emailNotificationUserPreferences],
  );

  return (
    <div className="mb-2 flex flex-col">
      <div className="mb-4 flex flex-col">
        <span className="font-semibold">Email notifications</span>
      </div>
      <div className="flex flex-col space-y-2">
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
      </div>
    </div>
  );
};

export { GranularEmailNotificationsSection };
