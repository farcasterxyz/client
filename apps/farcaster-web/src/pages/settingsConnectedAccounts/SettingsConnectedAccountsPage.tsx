import React from 'react';

import { Redirect } from '~/components/routing/Redirect';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

import { UnauthedSettingsConnectedAccountsPage } from './UnauthedSettingsConnectedAccountsPage';

const SettingsConnectedAccountsPage = React.memo(() => {
  const isSignedIn = useIsSignedIn();

  if (!isSignedIn) {
    return <UnauthedSettingsConnectedAccountsPage />;
  }

  return <Redirect url="/~/settings" />;
});

export { SettingsConnectedAccountsPage };
