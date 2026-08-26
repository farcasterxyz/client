import { memo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { WalletIcon } from '~/components/icons/WalletIcon';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';

const WalletPage = memo(() => {
  return (
    <Page meta={{ title: 'Wallet / Farcaster' }}>
      <div className="border-default sm:border-x">
        <PageHeader hideCastButton>
          <div className="flex items-center">
            <PageTitle>Wallet</PageTitle>
          </div>
        </PageHeader>
      </div>
      <BorderedMainContent className="flex flex-row p-6">
        <SettingsPageContent>
          <div className="flex w-full flex-row items-center justify-center rounded-2xl px-4 bg-elevated-nohover">
            <WalletIcon />
            <div className="p-3 text-base">
              Farcaster Wallet is available on Farcaster mobile.
            </div>
          </div>
        </SettingsPageContent>
      </BorderedMainContent>
    </Page>
  );
});

WalletPage.displayName = 'WalletPage';

export { WalletPage };
