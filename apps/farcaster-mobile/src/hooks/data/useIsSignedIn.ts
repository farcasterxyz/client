import { useAuthToken } from '~/contexts/AuthTokenProvider';

const useIsSignedIn = () => {
  return useAuthToken().isSignedIn;
};

export { useIsSignedIn };
