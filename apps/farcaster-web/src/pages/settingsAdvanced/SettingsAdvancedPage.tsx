import { memo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Page } from '~/components/page/Page';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { SettingsNav } from '~/layouts/SettingsNav';

const SettingsAdvancedPage = memo(() => {
  return (
    <Page meta={{ title: 'Advanced Settings / Farcaster' }}>
      <BorderedMainContent className="flex flex-row">
        <SettingsNav />
        <SettingsPageContent>Advanced</SettingsPageContent>
      </BorderedMainContent>
    </Page>
  );
});

SettingsAdvancedPage.displayName = 'SettingsAdvancedPage';

export { SettingsAdvancedPage };
