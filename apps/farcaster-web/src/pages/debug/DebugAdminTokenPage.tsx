import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAuth } from '~/contexts/AuthProvider';

const DebugAdminTokenPage: React.FC = React.memo(() => {
  const { authToken } = useAuth();
  const [tokenCopied, setTokenCopied] = React.useState(false);

  const token = React.useMemo(() => {
    if (authToken) {
      return authToken.secret;
    }
  }, [authToken]);

  return (
    <Page meta={{ title: 'Debug Admin Token' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>Debug: Admin Token</PageTitle>
        </PageHeader>
        <div className="flex flex-col space-y-2 p-4 pb-40">
          <DefaultButton
            className="w-64"
            disabled={tokenCopied}
            onClick={(e) => {
              e.stopPropagation();
              if (token) {
                navigator.clipboard.writeText(token);
                setTokenCopied(true);
              }
            }}
          >
            {tokenCopied ? 'Admin token copied' : 'Copy admin token'}
          </DefaultButton>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

DebugAdminTokenPage.displayName = 'DebugAdminTokenPage';

export { DebugAdminTokenPage };
