import { useVerifications } from 'farcaster-client-hooks';

import { useCurrentUser_UNSAFE } from './useCurrentUser';

const useCurrentUserVerifications = () => {
  const { fid } = useCurrentUser_UNSAFE();
  return useVerifications({ fid });
};

export { useCurrentUserVerifications };
