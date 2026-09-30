import {
  ApiConnectedApp,
  ApiGetConnectedAppsQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

const buildConnectedAppsFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetConnectedAppsQueryParams;
  }): PaginatedResultFetcher<ApiConnectedApp> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getConnectedApps({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.connectedApps,
      next: response.data.next,
    };
  };

export { buildConnectedAppsFetcher };
