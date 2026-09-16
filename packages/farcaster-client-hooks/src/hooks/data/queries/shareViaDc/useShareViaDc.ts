import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildShareViaDcFetcher } from './buildShareViaDcFetcher';
import { buildShareViaDcKey } from './buildShareViaDcKey';

const useShareViaDc = ({
  maxTargets,
  fresh,
  overrideFid,
  enabled = true,
}: {
  maxTargets?: number;
  fresh?: boolean;
  overrideFid?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    queryKey: buildShareViaDcKey({ maxTargets, fresh, overrideFid }),
    queryFn: buildShareViaDcFetcher({
      apiClient,
      maxTargets,
      fresh,
      overrideFid,
    }),
    enabled,
  });

  return result;
};

export { useShareViaDc };
