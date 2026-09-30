import {
  ApiChannelUser,
  ApiGetChannelUsersQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

const buildChannelUsersFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetChannelUsersQueryParams;
  }): PaginatedResultFetcher<ApiChannelUser> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getChannelUsers({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.users,
      next: response.data.next,
    };
  };

export { buildChannelUsersFetcher };
