import {
  useDevToolsDomainsOwned,
  useGetDomainManifestState,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useCurrentUser } from './useCurrentUser';
import { useIsAdmin } from './useIsAdmin';

export const useCurrentUserHasMiniAppAdminRights = (domain: string) => {
  const { fid } = useCurrentUser();
  const getDomainManifestState = useGetDomainManifestState();
  const { data: domainsOwned } = useDevToolsDomainsOwned();
  const isAdmin = useIsAdmin();

  return useCallback(async () => {
    try {
      if (isAdmin) {
        return true;
      }

      const state = await getDomainManifestState({ domain });
      if (!state.verified) {
        return false;
      }
      const associatedFid =
        !!state?.decodedManifest?.accountAssociation.fid &&
        state?.decodedManifest?.accountAssociation.fid === fid;
      if (associatedFid) {
        return true;
      }
      if (domainsOwned?.length) {
        return domainsOwned.some((ownedDomain) => ownedDomain === domain);
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [domain, getDomainManifestState, fid, isAdmin, domainsOwned]);
};
