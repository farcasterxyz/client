import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsDomainRolesFetcher } from './buildDevToolsDomainRolesFetcher';
import { buildDevToolsDomainRolesKey } from './buildDevToolsDomainRolesKey';

const useDevToolsDomainRoles = ({
  domain,
  enabled,
}: {
  domain: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDevToolsDomainRolesKey({ domain }),
    queryFn: buildDevToolsDomainRolesFetcher({
      apiClient,
      domain,
    }),
    enabled,
  });
};

export { useDevToolsDomainRoles };
