import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsGetRegisteredAccountAssociationFetcher } from './buildDevToolsGetRegisteredAccountAssociationFetcher';
import { buildDevToolsGetRegisteredAccountAssociationKey } from './buildDevToolsGetRegisteredAccountAssociationKey';

const useDevToolsGetRegisteredAccountAssociation = ({
  domain,
  enabled = true,
}: {
  domain: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsGetRegisteredAccountAssociationKey({ domain }),
    queryFn: buildDevToolsGetRegisteredAccountAssociationFetcher({
      apiClient,
      domain,
    }),
    enabled,
  });
};

export { useDevToolsGetRegisteredAccountAssociation };
