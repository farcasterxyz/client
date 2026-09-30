import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
} from '../../helpers';
import { buildDevToolsManagedAppsFetcher } from './buildDevToolsManagedAppsFetcher';
import { buildDevToolsManagedAppsKey } from './buildDevToolsManagedAppsKey';

export function useDevToolsManagedApps() {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDevToolsManagedAppsKey(),
    queryFn: buildDevToolsManagedAppsFetcher({
      apiClient,
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
