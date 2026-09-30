import {
  ApiChannelUser,
  ApiGetChannelUsersForManagementQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

const buildChannelUsersForManagementFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetChannelUsersForManagementQueryParams;
  }): PaginatedResultFetcher<ApiChannelUser> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getChannelUsersForManagement({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.users,
      next: response.data.next,
    };
  };

export { buildChannelUsersForManagementFetcher };
