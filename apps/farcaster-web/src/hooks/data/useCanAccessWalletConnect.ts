import { ADMIN_FIDS } from 'farcaster-client-data';
import { useMemo } from 'react';

import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';

const useCanAccessWalletConnect = () => {
  const fid = useCachedCurrentUser()?.fid;

  return useMemo(() => fid !== undefined && ADMIN_FIDS.has(fid), [fid]);
};

export { useCanAccessWalletConnect };
