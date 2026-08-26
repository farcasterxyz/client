import {
  ApiChannelUser,
  ApiGetChannelUsersForInviteQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

const buildChannelUsersForInviteFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetChannelUsersForInviteQueryParams;
  }): PaginatedResultFetcher<ApiChannelUser> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getChannelUsersForInvite({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.users,
      next: response.data.next,
    };
  };

export { buildChannelUsersForInviteFetcher };
