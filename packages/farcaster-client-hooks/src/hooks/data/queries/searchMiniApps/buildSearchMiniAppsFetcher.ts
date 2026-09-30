import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';
import { BatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import { defaultLimit } from './shared';

const buildSearchMiniAppsFetcher = ({
  query,
  limit = defaultLimit,
  apiClient,
  batchMergeIntoGlobalCache,
}: {
  query: string;
  limit?: number;
  apiClient: FarcasterApiClient;
  batchMergeIntoGlobalCache: BatchMergeIntoGloballyCachedFrame;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.searchMiniapps({
      cursor,
      limit,
      query,
    });

    batchMergeIntoGlobalCache(response.data.result.apps);

    return {
      items: response.data.result.apps,
      next: response.data.next,
    };
  });

export { buildSearchMiniAppsFetcher };
