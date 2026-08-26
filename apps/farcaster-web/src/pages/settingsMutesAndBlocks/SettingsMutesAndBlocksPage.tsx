import { memo, Suspense } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { SettingsNavLink } from '~/components/links/SettingsNavLink';
import { SettingsNavLinkLabel } from '~/components/links/SettingsNavLinkLabel';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { SettingsNav } from '~/layouts/SettingsNav';

const SettingsMutesAndBlocksPage = memo(() => {
  return (
    <Page meta={{ title: 'Mute and block / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-4 flex flex-col">
              <span className="mb-2 font-semibold">Mute and block</span>
              <div className="-mx-4 flex flex-col">
                <SettingsNavLink
                  to="settingsBlockedUsers"
                  params={{}}
                  searchParams={{}}
                  title="Blocked accounts"
                >
                  <SettingsNavLinkLabel>Blocked accounts</SettingsNavLinkLabel>
                </SettingsNavLink>
                <SettingsNavLink
                  to="settingsMutedUsers"
                  params={{}}
                  searchParams={{}}
                  title="Muted accounts"
                >
                  <SettingsNavLinkLabel>Muted accounts</SettingsNavLinkLabel>
                </SettingsNavLink>
                <SettingsNavLink
                  to="settingsMutedKeywords"
                  params={{}}
                  searchParams={{}}
                  title="Muted words"
                >
                  <SettingsNavLinkLabel>Muted words</SettingsNavLinkLabel>
                </SettingsNavLink>
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsMutesAndBlocksPage.displayName = 'SettingsMutesAndBlocksPage';

export { SettingsMutesAndBlocksPage };
