import { useOnboardingStateWithoutFallback } from 'farcaster-client-hooks';

// TODO make sure wallet is actually syncing the onboarding state somewhere
const useCurrentUser = () => {
  const { data } = useOnboardingStateWithoutFallback({
    query: {
      enabled: false,
    },
  });

  return data?.result.state.user;
};

const useCurrentUserFid = () => {
  const currentUser = useCurrentUser();
  return currentUser?.fid;
};

export { useCurrentUser, useCurrentUserFid };
