import { ADMIN_FIDS } from 'farcaster-client-data';
import { useCachedOnboardingState } from 'farcaster-client-hooks';
import { useMemo } from 'react';

const useIsAdmin = () => {
  const result = useCachedOnboardingState().result;
  const currentUser = result.state.user;

  return useMemo(
    () => typeof currentUser !== 'undefined' && ADMIN_FIDS.has(currentUser.fid),
    [currentUser],
  );
};

export { useIsAdmin };
