import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSnapBlocklistFetcher } from './buildSnapBlocklistFetcher';
import { buildSnapBlocklistKey } from './buildSnapBlocklistKey';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useSnapBlocklist = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildSnapBlocklistKey(),
    queryFn: buildSnapBlocklistFetcher({ apiClient }),
    staleTime: FIVE_MINUTES,
    gcTime: 30 * 60 * 1000,
    enabled,
  });
};
