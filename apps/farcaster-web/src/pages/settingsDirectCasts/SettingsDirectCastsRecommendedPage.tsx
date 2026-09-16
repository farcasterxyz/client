import { ApiDirectCastInboxPreference } from 'farcaster-client-data';
import {
  useSetUserPreferences,
  useTrackEvent,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { memo, Suspense, useCallback, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { SelectOne } from '~/components/forms/SelectOne';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { SettingsNav } from '~/layouts/SettingsNav';
import { trackError } from '~/utils/errorUtils';

const SettingsDirectCastsRecommendedPage = memo(() => {
  const { trackEvent } = useTrackEvent();
  const { data } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();

  const userPreferences = useMemo(() => {
    return data?.result.preferences || {};
  }, [data?.result.preferences]);

  const [controlledValue, setControlledValue] =
    useState<ApiDirectCastInboxPreference>(
      userPreferences.recommendDirectCastInbox ?? 'primary',
    );

  const onUserPreferenceValueChange = useCallback(
    async (value: ApiDirectCastInboxPreference) => {
      const previous = controlledValue;
      setControlledValue(value);

      try {
        await setUserPreferences({
          preferences: { ['recommendDirectCastInbox']: value },
        });

        trackEvent({
          name: 'update direct cast inbox preference',
          props: {
            classification: 'recommended',
            preference: value,
          },
        });
      } catch (error) {
        trackError(error);
        setControlledValue(previous);
      }
    },
    [controlledValue, setUserPreferences, trackEvent],
  );

  return (
    <Page meta={{ title: 'Direct Cast Settings / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <div className="flex items-center">
              <BackButton />
              <PageTitle>Suggested users</PageTitle>
            </div>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="flex flex-col">
              <div className="pb-3 text-base font-medium">
                Choose whether suggested users can send you messages
              </div>
              <div className="-mx-4">
                <SelectOne
                  options={[
                    { value: 'primary', title: 'Allow' },
                    {
                      value: 'request',
                      title: 'Request only',
                    },
                    {
                      value: 'block',
                      title: "Don't allow",
                    },
                  ]}
                  value={controlledValue}
                  onChange={onUserPreferenceValueChange}
                />
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsDirectCastsRecommendedPage.displayName =
  'SettingsDirectCastsRecommendedPage';

export { SettingsDirectCastsRecommendedPage };
