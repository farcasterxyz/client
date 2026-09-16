import {
  ApiFrame,
  ApiGetFavoriteFramesQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';
import { BatchMergeIntoGloballyCachedFrame } from '../frameDetails';

export const buildFavoriteFramesFetcher =
  ({
    apiClient,
    params,
    batchMergeIntoGlobalCache,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetFavoriteFramesQueryParams;
    batchMergeIntoGlobalCache: BatchMergeIntoGloballyCachedFrame;
  }): PaginatedResultFetcher<ApiFrame> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getFavoriteFrames({
      ...params,
      cursor,
    });

    batchMergeIntoGlobalCache(response.data.result.frames);

    return {
      items: response.data.result.frames,
      next: response.data.next,
    };
  };
