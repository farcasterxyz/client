import {
  ApiGetTopMiniAppsQueryParams,
  ApiRankedMiniApp,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

const buildTopMiniAppsFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetTopMiniAppsQueryParams;
  }): PaginatedResultFetcher<ApiRankedMiniApp> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getTopMiniApps({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.miniApps,
      next: response.data.next,
    };
  };

export { buildTopMiniAppsFetcher };
