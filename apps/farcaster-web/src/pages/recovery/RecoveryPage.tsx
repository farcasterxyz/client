import { FC, memo, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { isDev } from '~/constants/env';

const getRedirectUrl = () => {
  const webUrl = new URL(window.location.href);
  const redirectUrl = new URL('farcaster://recovery');
  redirectUrl.searchParams.set('email', webUrl.searchParams.get('email') ?? '');

  return redirectUrl.href;
};

const RecoveryPage: FC = memo(() => {
  useEffect(() => {
    document.head.innerHTML += `
      <meta
       http-equiv="refresh"
       content="0; url=${getRedirectUrl()}"
      />
    `;
  }, []);

  return (
    <Page meta={{ title: 'Complete account recovery' }}>
      <BorderedMainContent>
        <PageHeader>
          <PageTitle>Account Recovery</PageTitle>
        </PageHeader>
        <div className="flex flex-col space-y-12 p-4">
          <>
            <div>
              On your mobile device with Farcaster, either click the button or
              open the <strong>Camera</strong> app and scan the QR code:
            </div>
            <div>
              <DefaultButton
                title="Open Farcaster"
                // eslint-disable-next-line no-restricted-syntax
                onClick={() => (window.location.href = getRedirectUrl())}
              >
                Open Farcaster
              </DefaultButton>
            </div>
            <div>
              <RecoveryQRCode />
            </div>
          </>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

const RecoveryQRCode: FC = memo(() => {
  const url = document.location.href;

  return (
    <div className="overflow-hidden rounded-lg">
      <QRCode
        bgColor="#ffffff"
        ecLevel="H"
        eyeRadius={0}
        fgColor="#000000"
        size={260}
        value={url}
      />
      {isDev && (
        <div className="mt-2 text-sm">
          <div className="text-xs font-semibold text-faint">
            (Development Only)
          </div>
          <div>{url}</div>
        </div>
      )}
    </div>
  );
});

RecoveryPage.displayName = 'RecoveryPage';

export { RecoveryPage };
