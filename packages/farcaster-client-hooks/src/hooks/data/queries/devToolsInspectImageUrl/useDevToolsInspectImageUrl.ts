import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsInspectImageUrlFetcher } from './buildDevToolsInspectImageUrlFetcher';
import { buildDevToolsInspectImageUrlKey } from './buildDevToolsInspectImageUrlKey';

const useDevToolsInspectImageUrl = ({
  url,
  enabled = true,
}: {
  url: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsInspectImageUrlKey({ url }),
    queryFn: buildDevToolsInspectImageUrlFetcher({ apiClient, url }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useDevToolsInspectImageUrl };
