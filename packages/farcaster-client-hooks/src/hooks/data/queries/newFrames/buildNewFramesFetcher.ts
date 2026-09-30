import {
  ApiFrame,
  ApiGetNewFramesQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { PaginatedResultFetcher, wrapPaginatedFetcher } from '../../helpers';
import { BatchMergeIntoGloballyCachedFrame } from '../frameDetails';

export type NewFramesMetadata = {
  description?: string;
};

export const buildNewFramesFetcher = ({
  apiClient,
  params,
  batchMergeIntoGlobalCache,
  onMetadata,
}: {
  apiClient: FarcasterApiClient;
  params: ApiGetNewFramesQueryParams;
  batchMergeIntoGlobalCache: BatchMergeIntoGloballyCachedFrame;
  onMetadata: (metadata: NewFramesMetadata) => void;
}): PaginatedResultFetcher<ApiFrame> =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getNewFrames({
      ...params,
      cursor,
    });

    const { frames, description } = response.data.result;

    batchMergeIntoGlobalCache(frames);

    // Only capture metadata from the first page
    if (description) {
      onMetadata({ description });
    }

    return {
      items: frames,
      next: response.data.next,
    };
  });
