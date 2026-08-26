import { useCachedOnboardingState } from 'farcaster-client-hooks';

import { isSignedIn } from '~/utils/userUtils';

const useIsSignedIn = () => {
  const onboardingState = useCachedOnboardingState();

  return isSignedIn({ onboardingState });
};

export { useIsSignedIn };
