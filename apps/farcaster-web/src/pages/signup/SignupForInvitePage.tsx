import React, { FC, memo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { SignupForInvite } from '~/components/signup/SignupForInvite';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

const SignupForInvitePage: FC = memo(() => {
  const { inviterFid } = useParams('signupForInvite');
  const { id } = useSearchParams('signupForInvite');

  return (
    <Page meta={{ title: 'Join Farcaster' }}>
      <BorderedMainContent className="flex !min-h-dvh flex-col justify-center">
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          {<SignupForInvite inviterFid={inviterFid} urlIdentifier={id ?? ''} />}
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
});

SignupForInvitePage.displayName = 'SignupPage';

export { SignupForInvitePage };
