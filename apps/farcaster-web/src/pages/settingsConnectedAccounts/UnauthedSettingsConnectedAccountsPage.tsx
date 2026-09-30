import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Page } from '~/components/page/Page';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';

const UnauthedSettingsConnectedAccountsPage = React.memo(() => {
  return (
    <Page meta={{ title: 'Socials / Farcaster' }}>
      <BorderedMainContent className="flex flex-row sm:hidden">
        <SettingsPageContent>
          <div className="mt-10 flex w-full flex-col space-y-4 text-center">
            <div className="text-muted">Connection successful!</div>
            <div className="text-muted">
              Close this window and return to Farcaster.
            </div>
          </div>
        </SettingsPageContent>
      </BorderedMainContent>
    </Page>
  );
});

UnauthedSettingsConnectedAccountsPage.displayName =
  'UnauthedSettingsConnectedAccountsPage';

export { UnauthedSettingsConnectedAccountsPage };
