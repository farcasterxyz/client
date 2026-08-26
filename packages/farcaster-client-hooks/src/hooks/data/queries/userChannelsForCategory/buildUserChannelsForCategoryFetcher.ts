import {
  ApiChannel,
  ApiUserChannelsCategory,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedChannels } from '../../../../types';
import { PaginatedResultFetcher } from '../../helpers';

const buildUserChannelsForCategoryFetcher =
  ({
    fid,
    category,
    apiClient,
    batchMergeIntoGloballyCachedChannels,
  }: {
    fid: number;
    category: ApiUserChannelsCategory;
    apiClient: FarcasterApiClient;
    batchMergeIntoGloballyCachedChannels: BatchMergeIntoGloballyCachedChannels;
  }): PaginatedResultFetcher<ApiChannel> =>
  async ({ pageParam: cursor }) => {
    const response = await apiClient.getUserChannels({
      fid,
      category,
      cursor,
      limit: 30,
    });

    batchMergeIntoGloballyCachedChannels({
      batchUpdates: response.data.result.channels,
    });

    return {
      items: response.data.result.channels,
      next: response.data.next,
    };
  };

export { buildUserChannelsForCategoryFetcher };
