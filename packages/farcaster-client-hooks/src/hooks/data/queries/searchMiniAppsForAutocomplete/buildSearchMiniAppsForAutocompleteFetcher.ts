import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedFrame } from '../frameDetails';

const buildSearchMiniAppsForAutocompleteFetcher =
  ({
    query,
    apiClient,
    batchMergeIntoGlobalCache,
  }: {
    query: string;
    apiClient: FarcasterApiClient;
    batchMergeIntoGlobalCache: BatchMergeIntoGloballyCachedFrame;
  }) =>
  async () => {
    const response = await apiClient.searchMiniappsAutocomplete({
      query,
    });

    batchMergeIntoGlobalCache(response.data.result.apps);

    return response.data.result.apps;
  };

export { buildSearchMiniAppsForAutocompleteFetcher };
