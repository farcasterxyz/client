import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsTempAccountAssociationFetcher } from './buildDevToolsTempAccountAssociationFetcher';
import { buildDevToolsTempAccountAssociationKey } from './buildDevToolsTempAccountAssociationKey';

const useDevToolsTempAccountAssociation = ({
  domain,
  fid,
  enabled = true,
}: {
  domain: string;
  fid?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsTempAccountAssociationKey({ domain }),
    queryFn: buildDevToolsTempAccountAssociationFetcher({
      apiClient,
      domain,
      fid,
    }),
    staleTime: 0,
    gcTime: 0,
    enabled,
    retry: false,
  });
};

export { useDevToolsTempAccountAssociation };
