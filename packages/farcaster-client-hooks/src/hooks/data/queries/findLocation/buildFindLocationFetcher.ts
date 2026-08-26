import { QueryClient } from '@tanstack/react-query';
import { FarcasterApiClient } from 'farcaster-client-data';

import { buildFindLocationKey } from './buildFindLocationKey';

const buildFindLocationFetcher =
  ({
    apiClient,
    queryClient,
  }: {
    apiClient: FarcasterApiClient;
    queryClient: QueryClient;
  }) =>
  async ({ q }: { q: string }) => {
    const response = await apiClient.findLocation({
      q,
    });

    queryClient.setQueryData(buildFindLocationKey({ q }), response.data);

    return response.data;
  };

export { buildFindLocationFetcher };
