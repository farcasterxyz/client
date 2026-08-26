import { useSetUserPreferences } from 'farcaster-client-hooks';
import React, { memo, Suspense, useCallback } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Toggle } from '~/components/forms/Toggle';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { SettingsNav } from '~/layouts/SettingsNav';

const SettingsDeveloperToolsPage = memo(() => {
  const { developerModeEnabled } = useUserAppContext();

  const setUserPreferences = useSetUserPreferences(true);

  const onDeveloperModeEnabledChange = useCallback(() => {
    setUserPreferences({
      preferences: { enableDeveloperMode: !developerModeEnabled },
    });
  }, [developerModeEnabled, setUserPreferences]);

  return (
    <Page meta={{ title: 'Developer tools / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <div className="flex items-center">
              <PageTitle>Developer tools</PageTitle>
            </div>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-8 flex flex-col">
              <span className="font-semibold">Developer mode</span>
            </div>
            <div className="flex flex-col">
              <Toggle
                label="Enable developer tools"
                description="Click here to enable Mini App developer tools (manifest, embed, preview, etc.)"
                value={developerModeEnabled}
                onValueChange={onDeveloperModeEnabledChange}
              />
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsDeveloperToolsPage.displayName = 'SettingsDeveloperToolsPage';

export { SettingsDeveloperToolsPage };
