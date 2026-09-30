import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsMetaTagsFetcher } from './buildDevToolsMetaTagsFetcher';
import { buildDevToolsMetaTagsKey } from './buildDevToolsMetaTagsKey';

const useDevToolsMetaTags = ({
  url,
  enabled = true,
}: {
  url: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  return useQuery({
    queryKey: buildDevToolsMetaTagsKey({ url }),
    queryFn: buildDevToolsMetaTagsFetcher({ apiClient, url }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    enabled,
  });
};

export { useDevToolsMetaTags };
