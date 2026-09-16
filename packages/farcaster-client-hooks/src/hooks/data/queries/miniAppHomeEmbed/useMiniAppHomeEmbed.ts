import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildMiniAppHomeEmbedFetcher } from './buildMiniAppHomeEmbedFetcher';
import { buildMiniAppHomeEmbedKey } from './buildMiniAppHomeEmbedKey';

const useMiniAppHomeEmbed = ({ domain }: { domain: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildMiniAppHomeEmbedKey({ domain }),
    queryFn: buildMiniAppHomeEmbedFetcher({ domain, apiClient }),
  });
};

export { useMiniAppHomeEmbed };
