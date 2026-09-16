import { AnalyticsEvent } from 'farcaster-analytics';
import {
  EventingProvider,
  useVanityReferralCode,
} from 'farcaster-client-hooks';
import React from 'react';

import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { ReferralLandingPageContent } from '~/components/referral/ReferralLandingPageContent';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useParams } from '~/hooks/navigation/useParams';
import { isMobile } from '~/utils/navigatorUtils';

const schemeBase = 'farcaster://~/referral-code/';
const webBase = 'https://farcaster.xyz/~/code/';

export function VanityReferralLandingPage() {
  const { username } = useParams('vanityReferralLandingPage');
  const externalNavigate = useExternalNavigate();

  const { data } = useVanityReferralCode({ username: username ?? '' });
  const code = data?.referralCode;
  const deeplinkUri = `${schemeBase}${encodeURIComponent(code ?? '')}`;
  const webUri = `${webBase}${encodeURIComponent(code ?? '')}`;
  const to = isMobile() ? deeplinkUri : webUri;

  const inviter = data?.creator;

  const openClaimInvite = React.useCallback(() => {
    externalNavigate({
      to,
      openInNewTab: false,
    });
  }, [externalNavigate, to]);

  if (!username) {
    return (
      <Page meta={{ title: 'Join Farcaster' }}>
        <div className="flex min-h-dvh items-center justify-center bg-white">
          <div className="rounded-lg bg-gray-100 p-6 text-gray-600">
            No user provided.
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      meta={{
        title: `Join ${inviter?.displayName || 'someone'} on Farcaster`,
      }}
    >
      <EventingProvider on="vanityReferralLanding" key="vanityReferralLanding">
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <FullScreenErrorBoundary>
            <ReferralLandingPageContent
              username={inviter?.username || ''}
              avatar={inviter?.pfp?.url}
              referralCode={code}
              qrUrl={webUri}
              onJoinReferral={openClaimInvite}
              copyAnalyticsEvent={
                AnalyticsEvent.VanityReferralLandingPressCopyLink
              }
            />
          </FullScreenErrorBoundary>
        </React.Suspense>
      </EventingProvider>
    </Page>
  );
}
