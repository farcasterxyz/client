import {
  ApiFrame,
  ApiGetRecentlyLaunchedFramesQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher } from '../../helpers';
import { BatchMergeIntoGloballyCachedFrame } from '../frameDetails';

export const buildRecentlyLaunchedFramesFetcher =
  ({
    apiClient,
    params,
    batchMergeIntoGlobalCache,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetRecentlyLaunchedFramesQueryParams;
    batchMergeIntoGlobalCache: BatchMergeIntoGloballyCachedFrame;
  }): PaginatedResultFetcher<ApiFrame> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getRecentlyLaunchedFrames({
      ...params,
      cursor,
    });

    batchMergeIntoGlobalCache(response.data.result.frames);

    return {
      items: response.data.result.frames,
      next: response.data.next,
    };
  };
