import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { ApiExploreCastCollectibles200Response } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildExploreCastCollectiblesFetcher } from './buildExploreCastCollectiblesFetcher';
import { buildExploreCastCollectiblesKey } from './buildExploreCastCollectiblesKey';

const useExploreCastCollectibles = (
  options?: Omit<
    UseSuspenseQueryOptions<
      ApiExploreCastCollectibles200Response,
      unknown,
      ApiExploreCastCollectibles200Response,
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseQuery({
    queryKey: buildExploreCastCollectiblesKey(),
    queryFn: buildExploreCastCollectiblesFetcher({ apiClient }),
    ...options,
  });

  return result;
};

export { useExploreCastCollectibles };
