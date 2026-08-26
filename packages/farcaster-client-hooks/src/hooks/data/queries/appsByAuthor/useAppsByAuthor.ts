import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
} from '../../helpers';
import { buildAppsByAuthorFetcher } from './buildAppsByAuthorFetcher';
import { buildAppsByAuthorKey } from './buildAppsByAuthorKey';

export function useAppsByAuthor({ fid }: { fid: number }) {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildAppsByAuthorKey({ fid }),
    queryFn: buildAppsByAuthorFetcher({
      apiClient,
      fid,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  return extendResult(result, { flatData });
}
