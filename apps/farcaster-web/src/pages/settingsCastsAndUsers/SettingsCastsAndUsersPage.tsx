import { InfoIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserPreferenceCastsShown } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { memo, Suspense, useCallback, useEffect, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { SelectOne } from '~/components/forms/SelectOne';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { SettingsNav } from '~/layouts/SettingsNav';
import { trackError } from '~/utils/errorUtils';

const SettingsCastsAndUsersPage = memo(() => {
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
        // User is clicking same value
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
    <Page meta={{ title: 'Casts & Users / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-8">
              <div className="font-semibold">Casts & Users</div>
              <div className="mt-6">
                <div className="flex items-center">
                  <div className="mb-0.5 text-lg font-medium">
                    Show me replies from
                  </div>
                  <ExternalLink
                    title="info"
                    href={getNotionLinkTarget({ to: 'priority-mode' })}
                    className="ml-2"
                  >
                    <InfoIcon size={20} className="text-[#838893]" />
                  </ExternalLink>
                </div>
              </div>
              <div className="-mx-4">
                <SelectOne
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
                />
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsCastsAndUsersPage.displayName = 'SettingsCastsAndUsersPage';

export { SettingsCastsAndUsersPage };
