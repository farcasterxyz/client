import { memo, Suspense } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { PreferredWalletSelector } from '~/components/wallet/PreferredWalletDialog';
import { SettingsNav } from '~/layouts/SettingsNav';

const SettingsPreferredWalletPage = memo(() => {
  return (
    <Page meta={{ title: 'Preferred wallet / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <PreferredWalletSelector />
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsPreferredWalletPage.displayName = 'SettingsPreferredWalletPage';

export { SettingsPreferredWalletPage };
