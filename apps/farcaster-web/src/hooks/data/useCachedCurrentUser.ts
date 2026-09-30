import { useCachedOnboardingState } from 'farcaster-client-hooks';

const useCachedCurrentUser = () => {
  return useCachedOnboardingState().result.state.user;
};

export { useCachedCurrentUser };
