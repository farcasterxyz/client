import { ApiUser } from 'farcaster-client-data';
import { useGloballyCachedUser } from 'farcaster-client-hooks';

import { useCurrentUser_UNSAFE } from './useCurrentUser';

const useGloballyCachedCurrentUser = (): ApiUser => {
  const fallback = useCurrentUser_UNSAFE();
  return useGloballyCachedUser({ fallback });
};

export { useGloballyCachedCurrentUser };
