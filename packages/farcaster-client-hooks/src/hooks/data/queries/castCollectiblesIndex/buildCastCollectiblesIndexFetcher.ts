import {
  ApiCast,
  ApiGetCastCollectiblesIndexQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';

type PaginatedResult<T> = {
  items: T[];
  next?: {
    cursor?: string;
  };
};

const buildCastCollectiblesIndexFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetCastCollectiblesIndexQueryParams;
  }): PaginatedResultFetcher<ApiCast> =>
  async ({ pageParam }: { pageParam?: string }) => {
    const response = await apiClient.getCastCollectiblesIndex({
      ...params,
      cursor: pageParam,
    });

    const result: PaginatedResult<ApiCast> = {
      items: response.data.result.casts || [],
      next: response.data.next,
    };

    return result;
  };

export { buildCastCollectiblesIndexFetcher };
