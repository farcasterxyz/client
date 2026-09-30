import { ApiGetOnboardingState200Response } from 'farcaster-client-data';

const isSignedIn = ({
  onboardingState,
}: {
  onboardingState: ApiGetOnboardingState200Response;
}) => {
  const {
    result: {
      state: { user, hasCompletedRegistration },
    },
  } = onboardingState;

  if (!user || !hasCompletedRegistration) {
    return false;
  }

  return true;
};

const AnalyticsEventUsernameFallback = 'NoUsernameFound';

export { AnalyticsEventUsernameFallback, isSignedIn };
