import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';

import { Image } from '~/components/images/Image';
import { ExternalLink } from '~/components/links/ExternalLink';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
const MintPage: React.FC = React.memo(() => {
  const { dangerouslyTrackPreAuthEvent } = useAnalytics();
  const isSignedIn = useIsSignedIn();

  const navigate = useNavigate();

  const { url } = useSearchParams('mint');

  React.useEffect(() => {
    if (typeof url !== 'undefined') {
      dangerouslyTrackPreAuthEvent(AnalyticsEvent.MintWithWarpsDeepLinked, {
        url: url,
        'signed in': isSignedIn,
      });
    }
  }, [dangerouslyTrackPreAuthEvent, isSignedIn, url]);

  React.useEffect(() => {
    document.title = 'Download Farcaster';

    if (isSignedIn) {
      navigate({ to: 'homeFeed', params: {}, searchParams: { mintURL: url } });
    }
  }, [isSignedIn, navigate, url]);

  return (
    <div className="flex !min-h-dvh flex-col items-center justify-center">
      <span className="mb-8 text-center text-default">
        To mint using warps, create a Farcaster account.
      </span>
      <ExternalLink
        href="https://apps.apple.com/us/app/farcaster/id1600555445"
        title="Download iOS app"
      >
        <Image
          alt="Download iOS app"
          className="mb-4 max-w-[200px]"
          src={'https://farcaster.xyz/~/images/DownloadApple.png'}
        />
      </ExternalLink>
      <ExternalLink
        href="https://play.google.com/store/apps/details?id=com.farcaster.mobile"
        title="Download Android app"
      >
        <Image
          alt="Download Android app"
          className="mb-4 max-w-[200px]"
          src={'https://farcaster.xyz/~/images/DownloadGoogle.png'}
        />
      </ExternalLink>
    </div>
  );
});

MintPage.displayName = 'MintPage';

export { MintPage };
