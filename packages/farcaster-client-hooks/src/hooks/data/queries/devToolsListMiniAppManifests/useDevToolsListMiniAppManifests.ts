import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiDevToolsListMiniAppManifests200Response,
  ApiDevToolsListMiniAppManifestsQueryParams,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
} from '../../helpers';
import { buildDevToolsListMiniAppManifestsFetcher } from './buildDevToolsListMiniAppManifestsFetcher';
import { buildDevToolsListMiniAppManifestsKey } from './buildDevToolsListMiniAppManifestsKey';

const miniAppManifestKeyExtractor = (
  item: ApiDevToolsListMiniAppManifests200Response['result']['manifests'][number],
): string => {
  return item.id;
};

export function useDevToolsListMiniAppManifests(
  params?: Omit<ApiDevToolsListMiniAppManifestsQueryParams, 'cursor' | 'limit'>,
) {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDevToolsListMiniAppManifestsKey(params),
    queryFn: buildDevToolsListMiniAppManifestsFetcher({
      apiClient,
      params,
    }),
    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: miniAppManifestKeyExtractor,
  });

  return extendResult(result, { flatData });
}
