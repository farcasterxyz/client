import {
  ApiFrame,
  ApiGetTopFramesQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher, wrapPaginatedFetcher } from '../../helpers';
import { BatchMergeIntoGloballyCachedFrame } from '../frameDetails';

export const buildTopFramesFetcher = ({
  apiClient,
  params,
  batchMergeIntoGlobalCache,
}: {
  apiClient: FarcasterApiClient;
  params: ApiGetTopFramesQueryParams;
  batchMergeIntoGlobalCache: BatchMergeIntoGloballyCachedFrame;
}): PaginatedResultFetcher<ApiFrame> =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getTopFrames({
      ...params,
      cursor,
    });

    batchMergeIntoGlobalCache(response.data.result.frames);

    return {
      items: response.data.result.frames,
      next: response.data.next,
    };
  });
