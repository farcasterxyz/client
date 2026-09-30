import { useCachedOnboardingState } from 'farcaster-client-hooks';

const useOnboardingState = () => {
  return useCachedOnboardingState();
};

export { useOnboardingState };
