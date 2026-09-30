import { CheckIcon, CopyIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from 'react-router-dom';

import { Divider2 } from '~/components/Divider';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Page } from '~/components/page/Page';
import { GoToWarpcastHeader } from '~/components/pageHeader/GoToWarpcastHeader';
import { Well } from '~/components/Well';
import { isAndroid, isIOS, isMobile } from '~/utils/navigatorUtils';

/**
 * Generic page indicating that the link needs to be opened in the Farcaster
 * mobile app. You can use this if a vanity URL is not important.
 */
const OpenOnMobilePage: React.FC = React.memo(() => {
  const mobile = isMobile();
  const [copied, setCopied] = useState(false);

  const [params] = useSearchParams();
  const title = useMemo(() => {
    const path = params.get('path');
    switch (path) {
      case 'login-web':
        return 'Login via QR Code';
    }

    return 'Farcaster';
  }, [params]);

  return (
    <Page meta={{ title }}>
      <div className="flex min-h-dvh flex-col">
        <div className="w-full flex-none">
          <GoToWarpcastHeader />
        </div>
        {mobile && (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="relative my-6">
              <div className="absolute inset-x-0 top-0 z-0 flex justify-center">
                <Image
                  alt="Farcaster app"
                  src={'/~/images/AppDark.png'}
                  className={'hidden h-80 bg-app dark:block'}
                />
                <Image
                  alt="Farcaster app"
                  src={'/~/images/AppLight.png'}
                  className={'block h-80 bg-app dark:hidden'}
                />
              </div>
              <div className="relative z-10 mt-32">
                <div className="from-light-app-background dark:from-dark-app-background h-32 bg-gradient-to-t" />
                <div className="flex flex-col items-center pt-5 bg-app">
                  <div className="space-y-3 px-4 text-center">
                    <div className="text-2xl font-semibold text-default">
                      Install Farcaster
                    </div>
                    <div className="text-muted">
                      Open this link with your mobile phone in Farcaster.
                    </div>
                    <DefaultButton
                      variant="link"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setCopied(true);
                      }}
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}{' '}
                      <span className="ml-2">
                        {copied ? 'Copied' : 'Copy link'}
                      </span>
                    </DefaultButton>
                  </div>

                  <div className="w-full py-6">
                    <Divider2 text="or" />
                  </div>

                  {isIOS() && (
                    <ExternalLink
                      href="https://apps.apple.com/us/app/farcaster/id1600555445"
                      title="Download iOS app"
                      className="text-center"
                    >
                      <Image
                        alt="Download iOS app"
                        className="mb-4 inline max-w-[200px]"
                        src={'https://farcaster.xyz/~/images/DownloadApple.png'}
                      />
                    </ExternalLink>
                  )}
                  {isAndroid() && (
                    <ExternalLink
                      href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
                      title="Download Android app"
                    >
                      <Image
                        alt="Download Android app"
                        className="mb-4 max-w-[200px]"
                        src={
                          'https://farcaster.xyz/~/images/DownloadGoogle.png'
                        }
                      />
                    </ExternalLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {!mobile && (
          <div className="flex h-screen w-full flex-1 flex-col items-center justify-center">
            <Well size="xl" className="mx-4 my-8 max-w-md">
              <div className="flex flex-col items-center">
                <div className="max-w-[280px] overflow-hidden rounded-lg border p-4 bg-app">
                  <QRCode
                    bgColor="#ffffff"
                    ecLevel="H"
                    eyeRadius={0}
                    fgColor="#000000"
                    size={260}
                    value={document.location.href}
                  />
                </div>
                <div className="mt-9 space-y-3 text-center">
                  <div className="text-2xl font-semibold text-default">
                    Open link on mobile
                  </div>
                  <div className="font-light text-muted">
                    Open this link with your mobile phone in Farcaster.
                  </div>
                  <DefaultButton
                    variant="link"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {copied ? <CheckIcon /> : <CopyIcon />}{' '}
                      <span>{copied ? 'Copied' : 'Copy link'}</span>
                    </div>
                  </DefaultButton>
                </div>
              </div>
            </Well>
          </div>
        )}
      </div>
    </Page>
  );
});

OpenOnMobilePage.displayName = 'OpenOnMobilePage';

export { OpenOnMobilePage };
