import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { QRCode } from 'react-qrcode-logo';

import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { StandalonePage } from '~/components/page/StandalonePage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
const DownloadPage: React.FC = React.memo(() => {
  // When changing the title or description, change it also in SSR
  //
  const { dangerouslyTrackPreAuthEvent } = useAnalytics();

  return (
    <StandalonePage meta={{ title: 'Download Farcaster to sign up' }}>
      <div className="flex flex-col items-center px-4 pb-8 pt-6">
        <span className="text-center text-xl text-default">
          Scan the QR code to download Farcaster
        </span>
        <div className="my-3 max-w-[280px] border p-4 bg-app">
          <QRCode
            ecLevel="H"
            eyeRadius={0}
            fgColor="#000000"
            size={260}
            value={'https://farcaster.xyz/~/download/qr'}
          />
        </div>
        <span className="my-3 text-center text-xl text-default">
          Download from an app store
        </span>
        <div className="flex flex-row items-center justify-center space-x-3">
          <ExternalLink
            href="https://apps.apple.com/app/apple-store/id1600555445"
            title="Download iOS app"
            onClick={() => {
              dangerouslyTrackPreAuthEvent(
                AnalyticsEvent.ClickedDownloadApple,
                undefined,
              );
            }}
          >
            <Image
              alt="Download iOS app"
              className="max-h-[60px]"
              src={'https://farcaster.xyz/~/images/DownloadApple.png'}
            />
          </ExternalLink>
          <ExternalLink
            href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
            title="Download Android app"
            onClick={() => {
              dangerouslyTrackPreAuthEvent(
                AnalyticsEvent.ClickedDownloadGoogle,
                undefined,
              );
            }}
          >
            <Image
              alt="Download Android app"
              className="max-h-[60px]"
              src={'https://farcaster.xyz/~/images/DownloadGoogle.png'}
            />
          </ExternalLink>
        </div>
      </div>
    </StandalonePage>
  );
});

DownloadPage.displayName = 'DownloadPage';

export { DownloadPage };
