import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ApiCast, ApiCastCollectible } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedCast } from '../globallyCachedCast';
import { buildCastCollectibleFetcher } from './buildCastCollectibleFetcher';
import { buildCastCollectibleKey } from './buildCastCollectibleKey';
import { castCollectibleDefaultQueryOptions } from './castCollectibleDefaultQueryOptions';

const useCastCollectible = (
  params: { cast: ApiCast; refresh?: boolean },
  options?: Omit<
    UseQueryOptions<
      ApiCastCollectible | undefined,
      unknown,
      ApiCastCollectible | undefined,
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();
  const { cast, refresh = false } = params;

  return useQuery({
    ...castCollectibleDefaultQueryOptions,
    queryKey: buildCastCollectibleKey({ refresh, castHash: cast.hash }),
    queryFn: buildCastCollectibleFetcher({
      apiClient,
      params: { refresh, castHash: cast.hash },
      cast,
      mergeIntoGloballyCachedCast,
    }),
    ...options,
  });
};
export { useCastCollectible };
