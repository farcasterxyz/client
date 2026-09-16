import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFrameBlocklistFetcher } from './buildFrameBlocklistFetcher';
import { buildFrameBlocklistKey } from './buildFrameBlocklistKey';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useFrameBlocklist = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildFrameBlocklistKey(),
    queryFn: buildFrameBlocklistFetcher({ apiClient }),
    staleTime: FIVE_MINUTES,
    gcTime: 30 * 60 * 1000,
    enabled,
  });
};
