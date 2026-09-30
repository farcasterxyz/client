import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsDomainRolesFetcher } from './buildDevToolsDomainRolesFetcher';

const useFetchDevToolsDomainRoles = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain }: { domain: string }) => {
      const result = await buildDevToolsDomainRolesFetcher({
        apiClient,
        domain,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsDomainRoles };
