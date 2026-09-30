import { AnalyticsEvent } from 'farcaster-analytics';
import { EventingProvider, useReferralCode } from 'farcaster-client-hooks';
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

export function ReferralsV2Page() {
  const { code } = useParams('referralCodeLandingPage');
  const externalNavigate = useExternalNavigate();

  const deeplinkUri = `${schemeBase}${encodeURIComponent(code ?? '')}`;
  const webUri = `${webBase}${encodeURIComponent(code ?? '')}`;
  const to = isMobile() ? deeplinkUri : webUri;
  const query = useReferralCode({ code: code ?? '' });
  const inviter = query.data?.inviter;

  const openClaimInvite = React.useCallback(() => {
    externalNavigate({
      to,
      openInNewTab: false,
    });
  }, [externalNavigate, to]);

  if (!code) {
    return (
      <Page meta={{ title: 'Join Farcaster' }}>
        <div className="flex min-h-dvh items-center justify-center bg-white">
          <div className="rounded-lg bg-gray-100 p-6 text-gray-600">
            No referral code provided.
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
      <EventingProvider on="referralsLanding" key="referralsLanding">
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <FullScreenErrorBoundary>
            <ReferralLandingPageContent
              username={inviter?.username || ''}
              avatar={inviter?.pfp?.url}
              referralCode={code}
              qrUrl={webUri}
              onJoinReferral={openClaimInvite}
              copyAnalyticsEvent={AnalyticsEvent.ReferralLandingPressCopyLink}
            />
          </FullScreenErrorBoundary>
        </React.Suspense>
      </EventingProvider>
    </Page>
  );
}
