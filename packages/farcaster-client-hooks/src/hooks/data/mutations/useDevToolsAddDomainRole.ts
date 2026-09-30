import { ApiDomainRole } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateDevToolsDomainRoles } from '../queries/devToolsDomainRoles/useInvalidateDevToolsDomainRoles';
const useDevToolsAddDomainRole = () => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateDomainRoles = useInvalidateDevToolsDomainRoles();

  return useCallback(
    async ({
      domain,
      fid,
      role,
    }: {
      domain: string;
      fid: number;
      role: ApiDomainRole;
    }) => {
      const response = await apiClient.devToolsAddDomainRole({
        domain,
        fid,
        domainRole: role,
      });

      invalidateDomainRoles({ domain });

      return response.data.result.success;
    },
    [apiClient, invalidateDomainRoles],
  );
};

export { useDevToolsAddDomainRole };
