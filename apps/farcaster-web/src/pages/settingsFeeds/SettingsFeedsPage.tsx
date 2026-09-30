import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDefaultFeedPreference,
  ApiReplyFilterLevelPreference,
} from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Divider } from '~/components/Divider';
import { SelectOne } from '~/components/forms/SelectOne';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { SettingsNav } from '~/layouts/SettingsNav';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

const SettingsFeedsPage = memo(() => {
  const { trackEvent } = useAnalytics();
  const { data } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();

  const userPreferences = useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const [controlledFeedValue, setControlledFeedValue] =
    useState<ApiDefaultFeedPreference>(userPreferences.defaultFeed ?? 'home');

  const [controlledReplyFilterValue, setControlledReplyFilterValue] =
    useState<ApiReplyFilterLevelPreference>(
      userPreferences.replyFilterLevel ?? 'medium',
    );

  const onFeedUserPreferenceValueChange = useCallback(
    async (value: ApiDefaultFeedPreference) => {
      const previous = controlledFeedValue;
      setControlledFeedValue(value);

      trackEvent(AnalyticsEvent.SetDefaultFeed, { type: value });

      try {
        await setUserPreferences({
          preferences: { defaultFeed: value },
        });

        toast({
          message: 'Refresh to see your updated default feed!',
          toastId: 'updated-default-feed',
        });
      } catch (error) {
        trackError(error);
        setControlledFeedValue(previous);
      }
    },
    [controlledFeedValue, setUserPreferences, trackEvent],
  );

  const onReplyFilterUserPreferenceValueChange = useCallback(
    async (value: ApiReplyFilterLevelPreference) => {
      const previous = controlledReplyFilterValue;
      setControlledReplyFilterValue(value);

      trackEvent(AnalyticsEvent.SetReplyFilterLevel, { type: value });

      try {
        await setUserPreferences({
          preferences: { replyFilterLevel: value },
        });
      } catch (error) {
        trackError(error);
        setControlledReplyFilterValue(previous);
      }
    },
    [controlledReplyFilterValue, setUserPreferences, trackEvent],
  );

  return (
    <Page meta={{ title: 'Feeds settings / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <div className="flex items-center">
              <PageTitle>Feeds</PageTitle>
            </div>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-8 flex flex-col">
              <span className="font-semibold">Selected feed</span>
            </div>
            <div className="flex flex-col">
              <div className="pb-3 font-normal text-faint">
                This feed will appear first whenever you open Farcaster.
              </div>
              <div className="-mx-4">
                <SelectOne
                  options={[
                    { value: 'home', title: 'Home' },
                    {
                      value: 'following',
                      title: 'Following',
                    },
                  ]}
                  value={controlledFeedValue}
                  onChange={onFeedUserPreferenceValueChange}
                />
              </div>
            </div>
            <Divider />
            <div className="mt-4 flex flex-col">
              <span className="font-semibold">Reply filter</span>
            </div>
            <div className="flex flex-col">
              <div className="-mx-4">
                <SelectOne
                  options={[
                    {
                      value: 'high',
                      title: 'High',
                      subtitle: "Show replies I'm likely to be interested in.",
                    },
                    {
                      value: 'medium',
                      title: 'Medium',
                      subtitle: 'Show replies from most people.',
                    },
                    {
                      value: 'low',
                      title: 'Low',
                      subtitle: 'Show me replies from everyone.',
                    },
                  ]}
                  value={controlledReplyFilterValue}
                  onChange={onReplyFilterUserPreferenceValueChange}
                />
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsFeedsPage.displayName = 'SettingsFeedsPage';

export { SettingsFeedsPage };
