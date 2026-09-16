import { Turnstile } from '@marsidev/react-turnstile';
import { useSetTurnstileState } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { useParams } from '~/hooks/navigation/useParams';

const CloudflareChallengePage: FC = memo(() => {
  const { id: onboardingId } = useParams('cloudflareChallenge');
  const setCloudflareChallengeState = useSetTurnstileState();
  return (
    <Turnstile
      siteKey={'0x4AAAAAAA6mgMmizAQYQ9S6'}
      onSuccess={async (token) =>
        await setCloudflareChallengeState({ onboardingId, token })
      }
      onError={async (error) =>
        await setCloudflareChallengeState({ onboardingId, errorCode: error })
      }
    />
  );
});

CloudflareChallengePage.displayName = 'CloudflareChallengePage';

export { CloudflareChallengePage };
