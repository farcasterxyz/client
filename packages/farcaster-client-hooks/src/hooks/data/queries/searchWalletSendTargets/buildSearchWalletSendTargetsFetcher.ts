import {
  ApiSearchWalletSendTargetsQueryParams,
  ApiWalletSendTarget,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

const buildSearchWalletSendTargetsFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiSearchWalletSendTargetsQueryParams;
  }): PaginatedResultFetcher<ApiWalletSendTarget> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.searchWalletSendTargets({
      ...params,
      cursor,
    });

    return {
      items: response.data.result.targets,
      next: response.data.next,
    };
  };

export { buildSearchWalletSendTargetsFetcher };
