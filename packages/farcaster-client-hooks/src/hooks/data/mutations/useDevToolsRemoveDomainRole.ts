import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateDevToolsDomainRoles } from '../queries/devToolsDomainRoles';
import { useInvalidateDevToolsDomainsOwned } from '../queries/devToolsDomainsOwned';
import { useInvalidateDevToolsManagedApps } from '../queries/devToolsManagedApps';

const useDevToolsRemoveDomainRole = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDevToolsDomainRoles = useInvalidateDevToolsDomainRoles();
  const invalidateDevToolsDomainsOwned = useInvalidateDevToolsDomainsOwned();
  const invalidateDevToolsManagedApps = useInvalidateDevToolsManagedApps();
  return useCallback(
    async ({ domain, fid }: { domain: string; fid: number }) => {
      const response = await apiClient.devToolsRemoveDomainRole({
        domain,
        fid,
      });
      invalidateDevToolsDomainRoles({ domain });
      invalidateDevToolsDomainsOwned();
      invalidateDevToolsManagedApps();
      return response.data.result.success;
    },
    [
      apiClient,
      invalidateDevToolsDomainRoles,
      invalidateDevToolsDomainsOwned,
      invalidateDevToolsManagedApps,
    ],
  );
};

export { useDevToolsRemoveDomainRole };
